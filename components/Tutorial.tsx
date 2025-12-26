"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { X, ArrowRight, ArrowLeft } from "lucide-react";

const STEPS = [
    {
        title: "Welcome, Secretary!",
        text: "Hi! I'm your AI Assistant. I'm here to help you manage your meeting minutes. Let's show you around!",
        image: "/assets/avatar/1.png", // Smiling
        targetId: null, // Center
        position: "center"
    },
    {
        title: "Organize with Folders",
        text: "Start by creating a New Folder to keep your meetings organized by year or category.",
        image: "/assets/avatar/4.png", // Pointing
        targetId: "btn-new-folder",
        position: "target"
    },
    {
        title: "Create a Meeting",
        text: "Then, click New Meeting to start recording or uploading your session audio.",
        image: "/assets/avatar/2.png", // Happy
        targetId: "btn-new-meeting",
        position: "target"
    },
    {
        title: "Review & Export",
        text: "Once processed, you can edit the minutes and export them to Word documents instantly!",
        image: "/assets/avatar/3.png", // Standing
        targetId: null,
        position: "center"
    }
];

export function Tutorial({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const step = STEPS[currentStep];
        if (step.targetId) {
            const el = document.getElementById(step.targetId);
            if (el) {
                setTargetRect(el.getBoundingClientRect());
            }
        } else {
            setTargetRect(null);
        }
    }, [currentStep, isOpen]);

    if (!isOpen) return null;

    const step = STEPS[currentStep];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] pointer-events-none">
                {/* Backdrop if focused on an element */}
                {step.targetId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black"
                    />
                )}

                {/* Highlight Cutout (Simplified: Just putting the content near the target) */}
                {/* Since implementing a true cutout is complex, we'll just float the avatar near the target */}

                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="absolute pointer-events-auto flex flex-col items-center"
                    style={{
                        top: step.position === "center" ? "50%" : (targetRect ? targetRect.bottom + 20 : "50%"),
                        left: step.position === "center" ? "50%" : (targetRect ? targetRect.left - 100 : "50%"),
                        transform: step.position === "center" ? "translate(-50%, -50%)" : "none"
                    }}
                >
                    <div className="bg-white p-6 rounded-2xl shadow-2xl border-4 border-primary/20 max-w-sm relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>

                        <div className="flex flex-col items-center text-center">
                            <h3 className="text-xl font-bold text-primary mb-2">{step.title}</h3>
                            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                                {step.text}
                            </p>

                            <div className="flex gap-3 w-full">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        if (currentStep > 0) setCurrentStep(c => c - 1);
                                    }}
                                    disabled={currentStep === 0}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => {
                                        if (currentStep < STEPS.length - 1) {
                                            setCurrentStep(c => c + 1);
                                        } else {
                                            onClose();
                                        }
                                    }}
                                >
                                    {currentStep === STEPS.length - 1 ? "Get Started" : "Next"}
                                    {currentStep !== STEPS.length - 1 && <ArrowRight className="h-4 w-4 ml-2" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
