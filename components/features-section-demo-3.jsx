"use client";

import React from "react";
import { cn } from "@/lib/utils";
import createGlobe from "cobe";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { IconBrandYoutubeFilled } from "@tabler/icons-react";


export default function FeaturesSectionDemo() {
  const features = [
    {
      title: "Track issues effectively",
      description:
        "Track and manage your project issues with ease using our intuitive interface.",
      skeleton: <SkeletonOne />,
      className:
        "col-span-1 lg:col-span-4 border-b lg:border-r dark:border-neutral-800",
    },
    {
      title: "Capture pictures with AI",
      description:
        "Capture stunning photos effortlessly using our advanced AI technology.",
      skeleton: <SkeletonTwo />,
      className: "border-b col-span-1 lg:col-span-2 dark:border-neutral-800",
    },
    {
      title: "Watch our AI on YouTube",
      description:
        "Whether its you or Tyler Durden, you can get to know about our product on YouTube",
      skeleton: <SkeletonThree />,
      className:
        "col-span-1 lg:col-span-3 lg:border-r  dark:border-neutral-800",
    },
    {
      title: "Deploy in seconds",
      description:
        "With our blazing fast, state of the art, cutting edge, we are so back cloud servies (read AWS) - you can deploy your model in seconds.",
      skeleton: <SkeletonFour />,
      className: "col-span-1 lg:col-span-3 border-b lg:border-none",
    },
  ];
  return (
    <section className="relative w-full bg-gradient-to-b from-[#050511] via-[#0d1020] to-[#0b0b12] overflow-hidden text-white">
      <div className="relative z-20 py-6 lg:py-12 max-w-7xl mx-auto">
        <div className="px-8">
          <h4
            className="text-3xl lg:text-5xl lg:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium text-white">
            Packed with thousands of features
          </h4>

          <p
            className="text-sm lg:text-base max-w-2xl my-4 mx-auto text-white text-center font-normal">
            From Image generation to video generation, Everything AI has APIs for
            literally everything. It can even create this website copy for you.
          </p>
        </div>
      <div className="relative ">
        <div
          className="grid grid-cols-1 lg:grid-cols-6 mt-12 xl:border rounded-md dark:border-neutral-800">
          {features.map((feature) => (
            <FeatureCard key={feature.title} className={feature.className}>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className=" h-full w-full">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}

const FeatureCard = ({
  children,
  className
}) => {
  return (
    <div className={cn(`p-4 sm:p-8 relative overflow-hidden`, className)}>
      {children}
    </div>
  );
};

const FeatureTitle = ({
  children
}) => {
  return (
    <p
      className="max-w-5xl mx-auto text-left tracking-tight text-white text-xl md:text-2xl md:leading-snug">
      {children}
    </p>
  );
};

const FeatureDescription = ({
  children
}) => {
  return (
    <p
      className={cn(
        "text-sm md:text-base max-w-4xl text-left mx-auto",
        "text-white",
        "text-left max-w-sm mx-0 md:text-sm my-2"
      )}>
      {children}
    </p>
  );
};

export const SkeletonOne = () => {
  return (
    <div className="relative flex items-center justify-center py-6 px-3 h-72">
      <div className="w-full mx-auto bg-white dark:bg-neutral-900 shadow-xl rounded-lg overflow-hidden">
        <img
          src="/linear.webp"
          alt="header"
          width={600}
          height={600}
          className="h-72 w-full object-cover object-center rounded-md"
        />
      </div>

      {/* Soft top & bottom fade */}
      <div className="absolute bottom-0 z-40 inset-x-0 h-24 bg-gradient-to-t from-[#0b0b12] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 z-40 inset-x-0 h-24 bg-gradient-to-b from-[#0b0b12] via-transparent to-transparent pointer-events-none" />
    </div>
  );
};


export const SkeletonThree = () => {
  return (
    <div className="flex justify-center items-center">
      <a
        href="https://www.youtube.com/watch?v=RPa3_AD1_Vs"
        target="__blank"
        className="group block w-[300px] h-[300px] rounded-md overflow-hidden shadow-xl">
        <img
          src="https://assets.aceternity.com/fireship.jpg"
          alt="Watch on YouTube"
          width={300}
          height={300}
          className="w-[300px] h-[300px] object-cover rounded-md transition-all duration-200 group-hover:blur-sm"
        />
        <IconBrandYoutubeFilled className="absolute z-10 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 h-14 w-14 text-red-500 drop-shadow-lg" />
      </a>
    </div>
  );
};


export const SkeletonTwo = () => {
  const images = [
    "https://images.unsplash.com/photo-1517322048670-4fba75cbbb62?q=80&w=3000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1573790387438-4da905039392?q=80&w=3425&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1555400038-63f5ba517a47?q=80&w=3540&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1554931670-4ebfabf6e7a9?q=80&w=3387&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1546484475-7f7bd55792da?q=80&w=2581&auto=format&fit=crop",
  ];

  const imageVariants = {
    whileHover: { scale: 1.05, zIndex: 50 },
    whileTap: { scale: 1.05, zIndex: 50 },
  };

  return (
    <div className="relative flex flex-col items-center justify-center gap-3 py-4 h-72 overflow-hidden">
      <div className="flex flex-row justify-center gap-3">
        {images.slice(0, 3).map((image, idx) => (
          <motion.div
            key={`row1-${idx}`}
            variants={imageVariants}
            whileHover="whileHover"
            whileTap="whileTap"
            className="rounded-md overflow-hidden border border-neutral-800 bg-neutral-900"
          >
            <img
              src={image}
              alt="AI capture"
              className="h-28 w-28 md:h-32 md:w-32 object-cover"
            />
          </motion.div>
        ))}
      </div>
      <div className="flex flex-row justify-center gap-3">
        {images.slice(2, 5).map((image, idx) => (
          <motion.div
            key={`row2-${idx}`}
            variants={imageVariants}
            whileHover="whileHover"
            whileTap="whileTap"
            className="rounded-md overflow-hidden border border-neutral-800 bg-neutral-900"
          >
            <img
              src={image}
              alt="AI capture"
              className="h-28 w-28 md:h-32 md:w-32 object-cover"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};


export const SkeletonFour = () => {
  return (
    <div className="relative flex items-start justify-center py-2 overflow-visible">
      <div className="w-[300px] h-[300px] md:w-[360px] md:h-[360px] flex justify-center items-center">
        <Globe />
      </div>
    </div>
  );
};

export const Globe = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    let phi = 0;

    if (!canvasRef.current) return;
    // compute canvas pixel size based on element size and devicePixelRatio
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvasRef.current.getBoundingClientRect();
    const width = Math.max(300, Math.floor(rect.width * dpr));
    const height = Math.max(300, Math.floor(rect.height * dpr));

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: dpr,
      width,
      height,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 1, 1],
      markers: [
        { location: [37.7595, -122.4367], size: 0.03 },
        { location: [40.7128, -74.006], size: 0.1 },
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.005; // Smooth, slow rotation
      },
    });

    return () => globe.destroy();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
      }}
      className="rounded-full"
    />
  );
};





