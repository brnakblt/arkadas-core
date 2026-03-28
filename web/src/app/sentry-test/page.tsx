"use client";

import { useState } from "react";
import { captureError, captureMessage } from "@/lib/monitoring";

export default function SentryTestPage() {
    const [status, setStatus] = useState<string>("");

    const testError = () => {
        try {
            // This will throw an error
            throw new Error("Test error from Sentry Test Page");
        } catch (error) {
            captureError(error as Error, {
                component: "SentryTestPage",
                action: "testError",
            });
            setStatus("Error sent to Sentry!");
        }
    };

    const testMessage = () => {
        captureMessage("Test message from Sentry Test Page", "info", {
            component: "SentryTestPage",
            action: "testMessage",
        });
        setStatus("Message sent to Sentry!");
    };

    const testUnhandledError = () => {
        // This will cause an unhandled error
        setTimeout(() => {
            const obj = {} as Record<string, () => void>;
            // This will throw at runtime because the method is undefined
            obj.nonExistentMethod();
        }, 100);
    };

    return (
        <div className="min-h-screen p-8">
            <h1 className="text-2xl font-bold mb-6">Sentry Test Page</h1>

            <div className="space-y-4">
                <div className="p-4 bg-gray-100 rounded">
                    <h2 className="font-semibold mb-2">Configuration Check</h2>
                    <p className="text-sm">
                        DSN configured: {" "}
                        <span className={process.env.NEXT_PUBLIC_SENTRY_DSN ? "text-green-600" : "text-red-600"}>
                            {process.env.NEXT_PUBLIC_SENTRY_DSN ? "Yes" : "No (mock mode)"}
                        </span>
                    </p>
                </div>

                <div className="space-y-2">
                    <button
                        onClick={testError}
                        className="block px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Test Captured Error
                    </button>

                    <button
                        onClick={testMessage}
                        className="block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Test Message
                    </button>

                    <button
                        onClick={testUnhandledError}
                        className="block px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                    >
                        Test Unhandled Error
                    </button>
                </div>

                {status && (
                    <div className="p-4 bg-green-100 text-green-800 rounded">
                        {status}
                    </div>
                )}
            </div>

            <div className="mt-8 text-sm text-gray-600">
                <h3 className="font-semibold mb-2">Instructions:</h3>
                <ol className="list-decimal pl-5 space-y-1">
                    <li>Click &quot;Test Captured Error&quot; to send a handled error</li>
                    <li>Click &quot;Test Message&quot; to send an info message</li>
                    <li>Check your Sentry dashboard for the events</li>
                </ol>
            </div>
        </div>
    );
}
