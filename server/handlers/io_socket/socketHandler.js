const { Server } = require('socket.io');
const prisma = require('../../services/db');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const initFrontendSocketServer = require('./frontendHandler');
const fs = require('fs');
const redisClient = require('../../config/redisConfig');

let userCount = 0;
const FINAL_BET_STATUSES = new Set(['won', 'lost', 'cancelled']);
const OPEN_BET_STATUSES = ['open', 'pending', 'active'];
const PREVIOUS_ROUND_BET_LIMIT = 50;

// async function deleteAllFromModel() {
//     try {
//         await prisma.multiplier.deleteMany(); // Replace 'yourModelName' with your actual model name
//         console.log('All data deleted successfully.');
//     } catch (error) {
//         console.error('Error deleting data:', error);
//     } finally {
//         await prisma.$disconnect(); // Disconnect the client after operation
//     }
// }

// deleteAllFromModel();

const verifyUser = async (authToken) => {
    try {
        return await prisma.user.findUnique({ where: { auth_token: authToken } });
    } catch (error) {
        console.error('Error verifying user:', error);
        return null;
    }
};

const authenticateUser = async (socket, authToken) => {
    if (!authToken) {
        socket.emit('error', 'Authentication token not provided');
        return null;
    }
    try {
        const user = await verifyUser(authToken);
        if (!user) {
            socket.emit('error', 'Authentication failed');
            return null;
        }
        return user;
    } catch (error) {
        console.error('Error during user authentication:', error);
        socket.emit('error', 'Authentication error');
        return null;
    }
};

const fetchLiveBets = async (emitter) => {
    try {
        const latestMultiplier = await prisma.multiplier.findFirst({
            orderBy: { id: 'desc' },
        });

        if (!latestMultiplier) {
            console.log('No multiplier found.');
            emitter.emit('live-bets', {
                round_id: null,
                bets: [],
                totalBetsCount: 0,
                previousRoundBets: [],
                totalPreviousBetsCount: 0,
            });
            return;
        }
        // Fetch live bets for the latest round
        const liveBets = dedupeBetsByTrade(await prisma.bet.findMany({
            where: { round_id: latestMultiplier.id.toString() },
            orderBy: { createdAt: 'desc' },
        }));

        // Calculate the total number of bets for the latest round
        const totalBetsCount = liveBets.length;

        // Fetch the previous round's multiplier
        const previousRoundMultiplier = await prisma.multiplier.findFirst({
            where: { id: { lt: latestMultiplier.id } }, // Get the previous multiplier by ID
            orderBy: { id: 'desc' },
        });

        // Fetch the previous round's bets
        const previousRoundBets = previousRoundMultiplier
            ? dedupeBetsByTrade(await prisma.bet.findMany({
                where: { round_id: previousRoundMultiplier.id.toString() },
                orderBy: { createdAt: 'desc' },
                take: PREVIOUS_ROUND_BET_LIMIT,
            })).slice(0, PREVIOUS_ROUND_BET_LIMIT)
            : [];

        // Calculate the total number of bets for the previous round
        const totalPreviousBetsCount = previousRoundBets.length;

        // Emit live bets data
        emitter.emit('live-bets', {
            round_id: latestMultiplier.id.toString(),
            bets: liveBets,
            totalBetsCount,
            previousRoundBets,
            totalPreviousBetsCount,
        });

    } catch (error) {
        console.error('Error fetching round data:', error);
        emitter.emit('live-bets', {
            round_id: null,
            bets: [],
            totalBetsCount: 0,
            previousRoundBets: [],
            totalPreviousBetsCount: 0,
        });
    }
};

const placeBet = async (socket, io) => {
    socket.on('new-bet', async (bet) => {
        try {
            if (bet === "") return;
            const { round_id, code, appId } = bet;

            if (!round_id || !code || !appId) {
                socket.emit('error', 'Bet data is missing required round or account fields');
                return;
            }

            const normalizedBet = {
                ...bet,
                round_id: String(round_id),
                code: String(code),
                appId: String(appId),
                status: String(bet.status || '').toLowerCase(),
            };
            const isFinalStatus = FINAL_BET_STATUSES.has(normalizedBet.status);

            let existingBets = await prisma.bet.findMany({
                where: {
                    round_id: normalizedBet.round_id,
                    code: normalizedBet.code,
                    appId: normalizedBet.appId,
                },
                orderBy: { updatedAt: 'desc' },
            });
            let existingbet = existingBets[0];

            if (!existingbet && isFinalStatus) {
                existingBets = await prisma.bet.findMany({
                    where: {
                        code: normalizedBet.code,
                        appId: normalizedBet.appId,
                        status: { in: OPEN_BET_STATUSES },
                    },
                    orderBy: { updatedAt: 'desc' },
                    take: 1,
                });
                existingbet = existingBets[0];

                if (existingbet) {
                    normalizedBet.round_id = existingbet.round_id;
                }
            }

            let savedBet;

            if (existingbet) {
                savedBet = await prisma.bet.update({
                    where: {
                        id: existingbet.id,
                    },
                    data: normalizedBet,
                });
            } else {
                savedBet = await prisma.bet.create({
                    data: normalizedBet,
                });
            }

            const duplicateBetIds = existingBets
                .filter((existingBet) => existingBet.id !== savedBet.id)
                .map((existingBet) => existingBet.id);

            if (duplicateBetIds.length > 0) {
                await prisma.bet.deleteMany({
                    where: {
                        id: { in: duplicateBetIds },
                    },
                });
            }

            await prisma.bet.deleteMany({
                where: {
                    round_id: savedBet.round_id,
                    code: savedBet.code,
                    appId: savedBet.appId,
                    id: { not: savedBet.id },
                },
            });

            io.emit('bet-updated', savedBet);
            await emitAllBetsData(io);
            await fetchLiveBets(io);
            return;

        } catch (error) {
            console.error('Error creating new bet:', error);
            socket.emit('error', 'Failed to save bet');
        }
    });
}

const emitUserDataByToken = async (socket, authToken) => {
    try {
        const user = await verifyUser(authToken);

        if (!user) {
            socket.emit('error', 'Invalid or missing authentication token');
            return;
        }

        socket.emit('username', { username: user.username });
    } catch (error) {
        console.error('Error fetching user data:', error);
        socket.emit('error', 'Failed to fetch user data');
    }
};

const emitMultiplierData = async (socket) => {
    let multipliers;
    try {
        multipliers = await prisma.multiplier.findMany();
        socket.emit('multiplier_data', multipliers);

    } catch (error) {
        console.error('Error fetching multiplier data:', error);
        socket.emit('error', 'Failed to fetch multiplier data');
    }
};

const emitAllBetsData = async (emitter) => {
    try {
        const bets = await prisma.bet.findMany({
            orderBy: { createdAt: 'desc' },
        });
        emitter.emit('bets_data', dedupeBetsByTrade(bets));
    } catch (error) {
        console.error('Error fetching or emitting bets:', error);
    }
};

const getBetTradeKey = (bet) => `${bet.round_id}:${bet.code}:${bet.appId}`;

const getBetSortTime = (bet) => {
    const timestamp = new Date(bet.updatedAt || bet.createdAt || 0).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
};

const dedupeBetsByTrade = (bets) => {
    const byTrade = new Map();

    bets
        .slice()
        .sort((a, b) => getBetSortTime(b) - getBetSortTime(a))
        .forEach((bet) => {
            const tradeKey = getBetTradeKey(bet);

            if (!byTrade.has(tradeKey)) {
                byTrade.set(tradeKey, bet);
            }
        });

    return Array.from(byTrade.values()).sort((a, b) => getBetSortTime(b) - getBetSortTime(a));
};

const CHAT_MESSAGE_LIMIT = 100;
const DEFAULT_AVATAR = 'assets/images/avatar.png';

const getChatKey = (appId) => `chat:${appId}`;

const parseStoredChatMessage = (message) => {
    try {
        return JSON.parse(message);
    } catch {
        return null;
    }
};

const normalizeChatMessage = (message, user) => ({
    userId: user.username,
    message: typeof message.message === 'string' ? message.message : '',
    url: message.url || DEFAULT_AVATAR,
    gifUrl: message.gifUrl || '',
    messageId: message.messageId || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    betData: Array.isArray(message.betData) ? message.betData : [],
    timestamp: message.timestamp || Date.now(),
});

const appendChatLikes = async (appId, userId, messages) => Promise.all(
    messages.map(async (message) => {
        const likeCountKey = `chat:${appId}:message:${message.messageId}:likes`;
        const userLikesKey = `chat:${appId}:message:${message.messageId}:liked_users`;
        const totalLikes = await redisClient.get(likeCountKey);
        const userHasLiked = await redisClient.sismember(userLikesKey, userId);

        return {
            ...message,
            likeCount: totalLikes ? parseInt(totalLikes, 10) : 0,
            userHasLiked: userHasLiked === 1,
        };
    })
);

const handleChat = (socket, authToken, io) => {

    socket.on('join_chat', async (appId) => {
        try {
            console.log('Joining chat, verifying user...');

            const user = await verifyUser(authToken);
            if (!user) {
                console.log('Authentication failed for user:', authToken);
                socket.emit('error', 'Authentication failed');
                return;
            }

            if (!appId) {
                console.log('Missing Chat ID');
                socket.emit('error', 'Missing Chat ID');
                return;
            }

            const redisKey = `chat_count:${appId}`;
            socket.join(appId);
            console.log(`User ${user.userId} joined chat ${appId}`);

            // Increment user count
            const userCount = await redisClient.incr(redisKey);
            console.log(`User joined chat ${appId}, count: ${userCount}`);

            // Notify all clients of the updated user count
            io.to(appId).emit('chat_count', userCount);

            console.log(`Fetching recent messages for room: ${appId}`);
            const recentMessages = await redisClient.lrange(getChatKey(appId), 0, CHAT_MESSAGE_LIMIT - 1);

            if (recentMessages.length === 0) {
                console.log(`No messages found in chat room ${appId}`);
            }

            const storedMessages = recentMessages
                .map(parseStoredChatMessage)
                .filter(Boolean)
                .reverse();
            const messagesWithLikes = await appendChatLikes(appId, user.userId, storedMessages);
            socket.emit('chat_history', messagesWithLikes);

            console.log(`Messages with Likes:`, messagesWithLikes);
        } catch (error) {
            console.error('Error handling chat join:', error);
            socket.emit('error', 'Failed to join chat');
        }
    });


    socket.on('send_message', async (data) => {
        try {
            console.log('Sending message, verifying user...');

            const user = await verifyUser(authToken);
            if (!user) {
                console.log('Authentication failed for user:', authToken);
                socket.emit('error', 'Authentication failed');
                return;
            }

            const { appId, message, url, gifUrl, messageId, betData } = data;
            console.log(data)
            if (!appId) {
                console.log('Missing room ID');
                socket.emit('error', 'Missing room ID');
                return;
            }

            const msg = normalizeChatMessage({ message, url, gifUrl, messageId, betData }, user);
            console.log('Message to be sent:', msg);

            // Add message to Redis
            try {
                console.log(`Adding message to Redis for chat room: ${appId}`);
                await redisClient.lpush(getChatKey(appId), JSON.stringify(msg));
                console.log('Message added to Redis');

                // Limit the list to the maximum number of messages
                await redisClient.ltrim(getChatKey(appId), 0, CHAT_MESSAGE_LIMIT - 1);
                console.log(`Trimmed messages in Redis to the latest ${CHAT_MESSAGE_LIMIT} messages`);

                // Broadcast to the room
                await io.to(appId).emit('receive_message', [{ ...msg, likeCount: 0, userHasLiked: false }]);
                console.log(`Message Broadcasted: ${[msg]}`)
            } catch (redisError) {
                console.error('Error saving message to Redis:', redisError);
                socket.emit('error', 'Failed to save message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', 'Failed to send message');
        }
    });

    // Handle toggling like/unlike for a message
    socket.on('toggle_like_message', async (data) => {
        const { appId, messageId, userId } = data;
        const likeCountKey = `chat:${appId}:message:${messageId}:likes`;
        const userLikesKey = `chat:${appId}:message:${messageId}:liked_users`;

        // Check if user has already liked
        const alreadyLiked = await redisClient.sismember(userLikesKey, userId);

        let newLikeCount = 0;
        if (alreadyLiked) {
            // User is unliking the message
            await redisClient.srem(userLikesKey, userId);
            newLikeCount = Math.max(0, await redisClient.decr(likeCountKey));  // Decrease like count
        } else {
            await redisClient.sadd(userLikesKey, userId);
            newLikeCount = await redisClient.incr(likeCountKey);  
        }

        socket.emit('update_like_count', {
            messageId,
            likeCount: newLikeCount,
            userHasLiked: !alreadyLiked,  
        });
        socket.to(appId).emit('update_like_count', {
            messageId,
            likeCount: newLikeCount,
        });
    });


    socket.on('leave_chat', async (appId) => {
        try {
            if (!appId) {
                console.log('Missing Chat ID for leave_chat');
                return;
            }

            const redisKey = `chat_count:${appId}`;
            const userCount = await redisClient.decr(redisKey);
            if (userCount < 0) {
                await redisClient.set(redisKey, 0);
            }
            console.log(`User left chat ${appId}, count: ${Math.max(userCount, 0)}`);
            socket.to(appId).emit('chat_count', Math.max(userCount, 0));
        } catch (error) {
            console.error('Error leaving chat:', error);
        }
    });
};

const initFunctionsOnLiveData = async (socket) => {
    socket.on("load-live-bets", async (data) => {
        try {
            console.log('Loading live bets...');
            await fetchLiveBets(socket);
            await emitMultiplierData(socket);
            await emitAllBetsData(socket);
        } catch (err) {
            console.error('Error loading live bets:', err);
        }
    })
};

const initSocketServer = (httpServer) => {
    const io = new Server(httpServer, {
        pingInterval: 25000,
        pingTimeout: 60000,
        cors: {
            origin: true,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        allowEIO3: true,
    });

    io.on('connection', async (socket) => {
        console.log('New client connected');
        userCount++;
        io.emit('userCount', userCount);

        const pingInterval = setInterval(() => {
            socket.emit('ping');
        }, 25000);

        // Exclusively use the token from the socket handshake auth object.
        // This ensures the session is authorized via the token obtained from the Deriv popup.
        const authToken = socket.handshake.auth.token;

        try {
            const user = await authenticateUser(socket, authToken);
            if (!user) {
                socket.disconnect();
                return;
            }
            await emitUserDataByToken(socket, authToken);
            await placeBet(socket, io);
            handleChat(socket, authToken, io);
            initFrontendSocketServer(socket);
            await initFunctionsOnLiveData(socket);

            // Fetch live bets immediately and then every 2 seconds
            const fetchLiveBetsInterval = async () => {
                try {
                    await emitAllBetsData(socket);
                    await emitMultiplierData(socket);
                    await fetchLiveBets(socket); // Fetch live bets immediately
                } catch (error) {
                    console.error('Error fetching live bets:', error);
                }
            };

            // Run fetchLiveBets immediately
            fetchLiveBetsInterval();

            // Set interval to repeat fetchLiveBets every 2 seconds
            const liveBetsInterval = setInterval(fetchLiveBetsInterval, 2000);

            socket.on('disconnect', () => {
                clearInterval(pingInterval);
                clearInterval(liveBetsInterval); // Clear interval on disconnect
                console.log('Client disconnected');
                userCount--;
                io.emit('userCount', userCount);
            });
        } catch (error) {
            console.error('Connection setup failed:', error);
            socket.emit('error', 'Connection setup failed');
        }
    });

    return io;
};


process.on('SIGINT', () => {
    console.log('Interval cleared, shutting down.');
    process.exit(0);
});

module.exports = {
    initSocketServer,
};
