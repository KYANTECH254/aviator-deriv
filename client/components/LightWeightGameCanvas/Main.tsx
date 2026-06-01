"use client";

import { useState, useRef, useEffect } from "react";
import "./main.css";
import { useSession } from "@/context/SessionProvider";
import useUserInteraction from "@/hooks/useUserInteraction";
import { useSettings } from "@/context/SettingsContext";

const INITIAL_MULTIPLIER = 1;

function getMultiplierSourceValue(value: unknown) {
    if (typeof value === "object" && value !== null) {
        const v = value as { multiplier?: unknown; maxMultiplier?: unknown };
        // The server sends the live flight multiplier in the 'multiplier' field.
        // We specifically target this and avoid generic 'value' fields which often 
        // contain huge Round IDs or timestamps in other metadata objects.
        return v.multiplier ?? v.maxMultiplier ?? null;
    }
    return value;
}

function parseServerMultiplierValue(value: unknown) {
    const rawValue = getMultiplierSourceValue(value);

    const normalizedValue =
        typeof rawValue === "string"
            ? rawValue.replace(/x/gi, "").trim()
            : rawValue;

    const nextValue = Number(normalizedValue);

    // Sanity check: Multipliers are expected to be small, realistic numbers. 
    // If we receive a huge value (e.g. > 100,000), it's likely an ID or timestamp.
    if (!Number.isFinite(nextValue) || nextValue <= 0 || nextValue > 100000) {
        return INITIAL_MULTIPLIER;
    }

    return nextValue;
}


type FlightAnimationProps = {
    flying: boolean;
    flewAway: boolean;
};

function FlightAnimation({ flying, flewAway }: FlightAnimationProps) {
    const pathRef = useRef<SVGPathElement>(null);
    const fillRef = useRef<SVGPathElement>(null);
    const planeRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const lastPointRef = useRef({ x: 42, y: 220, angle: -8 });

    useEffect(() => {
        const path = pathRef.current;
        const fill = fillRef.current;
        const plane = planeRef.current;

        if (!path || !fill || !plane) return;

        const tailDistance = 48;
        const tailOffsetY = 28;

        const clearFrame = () => {
            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current);
                frameRef.current = null;
            }
        };

        const clearTrail = () => {
            path.setAttribute("d", "");
            fill.setAttribute("d", "");
        };

        const setPlane = (x: number, y: number, angle: number, opacity = 1) => {
            plane.style.opacity = String(opacity);
            plane.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${angle}deg)`;
            lastPointRef.current = { x, y, angle };
        };

        const getPlaneCenterFromTail = (tailX: number, tailY: number, angle: number) => {
            const radians = (angle * Math.PI) / 180;

            return {
                x: tailX + Math.cos(radians) * tailDistance + Math.sin(radians) * tailOffsetY,
                y: tailY + Math.sin(radians) * tailDistance - Math.cos(radians) * tailOffsetY,
            };
        };

        if (flewAway) {
            clearFrame();
            clearTrail();

            const start = lastPointRef.current;
            const parent = plane.parentElement;
            const width = parent?.clientWidth || 600;
            const flyStart = performance.now();
            const duration = 720;

            const animateAway = (time: number) => {
                const progress = Math.min((time - flyStart) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);

                const x = start.x + (width + 180 - start.x) * eased;
                const y = start.y - 36 * eased + Math.sin(progress * Math.PI * 3) * 6;
                const angle = start.angle + 18 * eased;

                setPlane(x, y, angle, 1);

                if (progress < 1) {
                    frameRef.current = requestAnimationFrame(animateAway);
                    return;
                }

                setPlane(x, y, angle, 0);
            };

            plane.style.display = "block";
            frameRef.current = requestAnimationFrame(animateAway);

            return clearFrame;
        }

        if (!flying) {
            clearFrame();
            clearTrail();
            plane.style.opacity = "0";
            return clearFrame;
        }

        clearFrame();
        clearTrail();

        startTimeRef.current = performance.now();
        plane.style.display = "block";
        plane.style.opacity = "1";

        const animate = (time: number) => {
            const parent = plane.parentElement;
            const width = parent?.clientWidth || 600;
            const height = parent?.clientHeight || 260;

            const elapsed = time - startTimeRef.current;
            const takeoffDuration = 4200;
            const progress = Math.min(elapsed / takeoffDuration, 1);

            const startTailX = 34;
            const axisY = height - 32;
            const runwayEndX = width * 0.22;
            const maxTailX = width * 0.72;
            const cruiseTailY = height * 0.42;

            const runwayProgress = Math.min(progress / 0.32, 1);
            const takeoffProgress = Math.min(Math.max((progress - 0.28) / 0.72, 0), 1);
            const takeoffEase = takeoffProgress * takeoffProgress * (3 - 2 * takeoffProgress);

            let tailX: number;
            let tailY: number;
            let angle: number;

            if (progress < 0.32) {
                tailX = startTailX + (runwayEndX - startTailX) * runwayProgress;
                tailY = axisY;
                angle = -2 - runwayProgress * 3;
            } else {
                const forwardEase = takeoffProgress * takeoffProgress * (3 - 2 * takeoffProgress);
                const liftEase = takeoffProgress * takeoffProgress * (3 - 2 * takeoffProgress);

                tailX = runwayEndX + (maxTailX - runwayEndX) * forwardEase;

                const lift = (axisY - cruiseTailY) * liftEase;
                const wobbleStrength = Math.min(takeoffProgress, 1);
                const wobble = Math.sin(time / 1350) * 32 * wobbleStrength;
                const downPush = Math.max(0, Math.sin(time / 1350)) * 62 * wobbleStrength;

                tailY = axisY - lift + wobble + downPush;
                tailY = Math.min(axisY, tailY);

                angle = -5 - takeoffEase * 3 + Math.sin(time / 1250) * 3 * wobbleStrength;
            }

            const planeCenter = getPlaneCenterFromTail(tailX, tailY, angle);

            const distanceFromStart = Math.max(0, tailX - startTailX);
            const curvePower = Math.min(1, distanceFromStart / (width * 0.42));

            let trailPath: string;

            if (tailY >= axisY - 1) {
                trailPath = `M ${startTailX} ${axisY} L ${tailX} ${axisY}`;
            } else {
                const c1x = startTailX + distanceFromStart * 0.45;
                const c1y = axisY;

                const c2x = startTailX + distanceFromStart * 0.76;
                const c2y = axisY - (axisY - tailY) * 0.12 * curvePower;

                trailPath = `M ${startTailX} ${axisY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tailX} ${tailY}`;
            }

            const fillPath = `${trailPath} L ${tailX} ${axisY} L ${startTailX} ${axisY} Z`;

            path.setAttribute("d", trailPath);
            fill.setAttribute("d", fillPath);
            setPlane(planeCenter.x, planeCenter.y, angle);

            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        return clearFrame;
    }, [flying, flewAway]);

    return (
        <div className="flight-layer">
            <svg className="flight-svg" aria-hidden="true">
                <path ref={fillRef} className="flight-fill" />
                <path ref={pathRef} className="flight-trail" />
            </svg>

            <div ref={planeRef} className="flight-plane">
                <img
                    className="flight-plane-img"
                    src="/assets/images/plane.png"
                    alt=""
                    draggable={false}
                />
            </div>
        </div>
    );
}

export default function Main() {
    const { multiplier, maxMultiplier, crashed } = useSession();
    const { isSoundEnabled, isAnimationEnabled } = useSettings();
    const { eventTriggered } = useUserInteraction();

    useEffect(() => {
        console.log('Multiplier value:', multiplier);
    }, [multiplier]);

    const milestoneRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const flewAwayAudioRef = useRef<HTMLAudioElement | null>(null);
    const engineAudioRef = useRef<HTMLAudioElement | null>(null);

    const [prevCrashState, setPrevCrashState] = useState<string | null>(null);
    const [showFlyAway, setShowFlyAway] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [showLoader, setShowLoader] = useState(false);
    const [roundStarted, setRoundStarted] = useState(false);
    const [hasPlayedTakeoff, setHasPlayedTakeoff] = useState(false);

    useEffect(() => {
        return () => {
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    useEffect(() => {
        updateMilestone(parseServerMultiplierValue(multiplier));
    }, [multiplier]);

    useEffect(() => {
        if (!crashed || crashed === prevCrashState) return;

        setPrevCrashState(crashed);

        if (isSoundEnabled) {
            if (!flewAwayAudioRef.current) {
                flewAwayAudioRef.current = new Audio("/assets/audio/aviatorflewaway.mp3");
            }

            if (!engineAudioRef.current) {
                engineAudioRef.current = new Audio("/assets/audio/aviatortakeoff.mp3");
            }

            if (crashed === "true" && eventTriggered) {
                engineAudioRef.current.pause();
                flewAwayAudioRef.current.currentTime = 0;
                flewAwayAudioRef.current.play().catch((error) => {
                    console.warn("Flew away audio play error:", error);
                });
                setHasPlayedTakeoff(false);
            } else if (crashed === "false" && eventTriggered && !hasPlayedTakeoff) {
                flewAwayAudioRef.current.pause();
                engineAudioRef.current.currentTime = 0;
                engineAudioRef.current.play().catch((error) => {
                    console.warn("Engine audio play error:", error);
                });
                setHasPlayedTakeoff(true);
            }
        }

        if (crashed === "true" && maxMultiplier) {
            handleCrashSequence();
            return;
        }

        if (crashed === "false") {
            startNewRound();
        }
    }, [crashed, maxMultiplier, isSoundEnabled, eventTriggered, hasPlayedTakeoff, prevCrashState]);

    function handleCrashSequence() {
        if (!milestoneRef.current) return;

        if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
        }

        milestoneRef.current.setAttribute("data-state", "flewAway");
        setRoundStarted(false);
        setShowFlyAway(true);
        setShowLoader(false);
        setIsWaiting(false);

        setTimeout(() => {
            setShowFlyAway(false);
            animateWaitingForBets();
        }, 2000);
    }

    function startNewRound() {
        if (!milestoneRef.current) return;

        if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
        }

        milestoneRef.current.setAttribute("data-state", "flying");
        setRoundStarted(true);
        setIsWaiting(false);
        setShowFlyAway(false);
        setShowLoader(false);
    }

    function updateMilestone(current: number) {
        if (!milestoneRef.current) return;

        const milestone = current < 2 ? "1" : current < 10 ? "2" : "3";
        milestoneRef.current.setAttribute("data-milestone", milestone);
    }

    function animateWaitingForBets() {
        if (!milestoneRef.current) return;

        setIsWaiting(true);
        setShowLoader(true);
        milestoneRef.current.setAttribute("data-state", "loading");

        const startTime = performance.now();
        const duration = 5000;

        const drawFrame = () => {
            const elapsed = performance.now() - startTime;

            if (elapsed < duration) {
                animationRef.current = requestAnimationFrame(drawFrame);
                return;
            }

            setIsWaiting(false);
            setShowLoader(false);
        };

        animationRef.current = requestAnimationFrame(drawFrame);
    }

    const multiplierText = multiplier ?? "";
    const maxMultiplierText = maxMultiplier ?? "";
    const showCurrentScore = !isWaiting && (roundStarted || showFlyAway);
    const showFlewAway = showFlyAway && !isWaiting;

    return (
        <div
            className="aviator gameD"
            data-animation={isAnimationEnabled ? "enabled" : "disabled"}
            data-state="flying"
            ref={milestoneRef}
        >
            <div className="light-canvas">
                <div className="bg-sun"></div>

                {(roundStarted || showFlyAway) && isAnimationEnabled && (
                    <>
                        <div className="dotsT dotsHorizontal"></div>
                        <div className="dotsT dotsVertical"></div>
                    </>
                )}

                {roundStarted && (
                    <div className="lighting" style={{ zIndex: 1 }}></div>
                )}

                {isAnimationEnabled && (
                    <FlightAnimation flying={roundStarted} flewAway={showFlyAway} />
                )}

                {showCurrentScore && (
                    <div className="score" style={{ zIndex: 20 }}>
                        {showFlewAway ? <div className="messageG">Flew away!</div> : null}
                        <div className="valueS">{showFlewAway ? maxMultiplierText : multiplierText}</div>
                    </div>
                )}

                {isWaiting && (
                    <div className="waiting-wrapper">
                        <p className="waiting-text">WAITING FOR NEXT ROUND</p>
                        <div className="loader-background">
                            <div className="loader-progress" id="loaderProgress"></div>
                        </div>
                    </div>
                )}

                {showLoader && (
                    <div className="aviator-static-loader" style={{ zIndex: 25 }}>
                        <img src="assets/images/loader.gif" alt="Loading" />
                    </div>
                )}
            </div>
        </div>
    );
}
