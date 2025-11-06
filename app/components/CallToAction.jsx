"use client";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
import starsBg from "@/assets/stars.png";
import gridLines from "@/assets/grid-lines.png";
import { motion, useMotionTemplate, useMotionValue, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

const useRelativeMousePosition = (to) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const updateMousePosition = (event) => {
    if (!to.current) return;
    const { top, left } = to.current.getBoundingClientRect();
    mouseX.set(event.x - left);
    mouseY.set(event.y - top);
  };

  useEffect(() => {
    window.addEventListener("mousemove", updateMousePosition);
    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
    };
  }, []);

  return [mouseX, mouseY];
};

export const CallToAction = () => {
  const sectionRef = useRef(null);
  const borderedDivRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const backgroundPositionY = useTransform(scrollYProgress, [0, 1], [-300, 300]);
  const [mouseX, mouseY] = useRelativeMousePosition(borderedDivRef);
  const imageMask = useMotionTemplate`radial-gradient(50% 50% at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <section
      ref={sectionRef}
      className="min-h-screen flex items-center justify-center bg-black text-white"
    >
      <div className="container px-4">
        <motion.div
          ref={borderedDivRef}
          className="relative cursor-grab border border-white/15 py-24 rounded-xl overflow-hidden group max-w-6xl mx-auto w-full"
          animate={{
            backgroundPositionX: starsBg.width,
          }}
          transition={{
            duration: 40,
            ease: "linear",
            repeat: Infinity,
          }}
          style={{
            backgroundPositionY,
            backgroundImage: `url(${starsBg.src})`,
          }}
        >
          {/* Base layer */}
          <div
            className="absolute inset-0 bg-[rgb(74,32,138)] bg-blend-overlay [mask-image:radial-gradient(50%_50%_at_50%_35%,black,transparent)] group-hover:opacity-0 transition duration-700"
            style={{
              backgroundImage: `url(${gridLines.src})`,
            }}
          ></div>

          {/* Hover layer */}
          <motion.div
            className="absolute inset-0 bg-[rgb(74,32,138)] bg-blend-overlay opacity-0 group-hover:opacity-100"
            style={{
              maskImage: imageMask,
              backgroundImage: `url(${gridLines.src})`,
            }}
          ></motion.div>

          {/* Text + Button */}
          <div className="relative text-center">
            <h2 className="text-5xl md:text-6xl font-medium tracking-tighter max-w-2xl mx-auto">
              Empower Your Financial Future with WealthPulse
            </h2>
            <p className="text-lg md:text-xl text-white/70 mt-5 max-w-lg mx-auto">
              Real-time AI insights, smart investing tools, and personalized learning,
              all in one seamless platform to help you invest confidently and grow smarter.
            </p>

            <div className="flex justify-center mt-8">
              <SignedOut>
                <SignUpButton mode="redirect">
                  <button
                    className="relative inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white rounded-full
                             bg-purple-600 hover:bg-purple-700
                             transition-all duration-300 shadow-[0_0_25px_rgba(168,85,247,0.4)]
                             hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] active:scale-95"
                  >
                    Get Started
                  </button>
                </SignUpButton>
              </SignedOut>

              <SignedIn>
                <a href="/Portfolio" className="relative inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white rounded-full
                             bg-purple-600 hover:bg-purple-700
                             transition-all duration-300 shadow-[0_0_25px_rgba(168,85,247,0.4)]
                             hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] active:scale-95">
                  Get Started
                </a>
              </SignedIn>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
