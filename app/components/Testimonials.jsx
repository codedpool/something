'use client'
import avatar1 from "@/assets/avatar-1.png";
import avatar2 from "@/assets/avatar-2.png";
import avatar3 from "@/assets/avatar-3.png";
import avatar4 from "@/assets/avatar-4.png";
import Image from "next/image";
import { motion } from "framer-motion";

const testimonials = [
  {
    text: "“This product has completely transformed how I manage my projects and deadlines”",
    name: "Sweety Patel",
    title: "Director @ Quantum",
    avatarImg: avatar1,
  },
  {
    text: "“These AI tools have completely revolutionized our SEO entire strategy overnight”",
    name: "Jaymin Limbu",
    title: "Founder @ Pulse",
    avatarImg: avatar2,
  },
  {
    text: "“The user interface is so intuitive and easy to use, it has saved us countless hours”",
    name: "Kamla Harrice",
    title: "Product @ Innovate",
    avatarImg: avatar3,
  },
  {
    text: "“Our team's productivity has increased significantly since we started using this tool”",
    name: "John Doe",
    title: "CTO @ Tech Solutions",
    avatarImg: avatar4,
  },
];

export const Testimonials = () => {
  return (
    <section className="py-20 md:py-24 bg-black">
      <div className="container flex flex-col items-center justify-center mx-auto">
        <h2 className="text-5xl md:text-6xl font-medium tracking-tighter text-white text-center mx-auto">
          Beyond Expectations.
        </h2>
        <p className="text-gray-400 text-lg md:text-xl max-w-sm mx-auto text-center mt-5 tracking-tight">
          Our revolutionary AI SEO tools have transformed our clients' strategies.
        </p>

        {/* Hide scrollbar cleanly */}
        <div className="relative w-full mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
          <motion.div
            initial={{ translateX: `-50%` }}
            animate={{ translateX: `0%` }}
            transition={{
              ease: "linear",
              repeat: Infinity,
              duration: 30,
            }}
            className="flex gap-5 pr-5 flex-none will-change-transform"
          >
            {[...testimonials, ...testimonials].map((testimonial) => (
              <div
                key={testimonial.name}
                className="border border-white/15 p-6 md:p-10 rounded-xl bg-[linear-gradient(to_bottom_left,rgb(140,69,255,.3),black)] max-w-xs md:max-w-md flex-none"
              >
                <div className="text-lg md:text-xl tracking-tight text-white">
                  {testimonial.text}
                </div>
                <div className="flex items-center gap-3 mt-5">
                  <div className="relative">
                    <Image
                      src={testimonial.avatarImg}
                      alt={`Avatar for ${testimonial.name}`}
                      className="h-11 w-11 rounded-xl grayscale border border-white/30"
                    />
                  </div>
                  <div>
                    <div className="text-white">{testimonial.name}</div>
                    <div className="text-white/50 text-sm">{testimonial.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
