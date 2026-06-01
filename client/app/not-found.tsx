import React from "react";
import { Metadata } from "next";
import ErrorLoader from "@/components/ErrorLoader";
export const metadata: Metadata = {
  title: "An error occured",
};

const ErrorPage = () => {
  return (
    <>
    <ErrorLoader/>
    </>
  );
};

export default ErrorPage;
