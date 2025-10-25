"use client";

import { useEffect } from "react";
import { gsap } from "gsap";

// CODE FROM: https://codepen.io/MAW/pen/KdmwMb

export default function FallingLeaves() {
  useEffect(() => {
    const total = 30;
    const container = document.getElementById("leaves-container");
    if (!container) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    const R = (min: number, max: number): number =>
      min + Math.random() * (max - min);

    for (let i = 0; i < total; i++) {
      const div = document.createElement("div");
      div.className = "leaf-dot absolute w-[35px] h-[35px] pointer-events-none";
      div.setAttribute(
        "style",
        "background-image:url('https://www.clipartqueen.com/image-files/red-lobed-fall-clipart-leaf.png'); background-size: 100% 100%;",
      );
      gsap.set(div, { x: R(0, w), y: R(-200, -150), z: R(-200, 200) });
      container.appendChild(div);
      animateLeaf(div, h, R);
    }

    function animateLeaf(
      elm: HTMLElement,
      h: number,
      R: (min: number, max: number) => number,
    ) {
      gsap.to(elm, {
        y: h + 100,
        duration: R(6, 15),
        ease: "none",
        repeat: -1,
        delay: -15,
      });
      gsap.to(elm, {
        x: "+=100",
        rotationZ: R(0, 180),
        duration: R(4, 8),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(elm, {
        rotationX: R(0, 360),
        rotationY: R(0, 360),
        duration: R(2, 8),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: -5,
      });
    }

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <div
      id="leaves-container"
      className="pointer-events-none fixed inset-0 overflow-hidden z-[1] perspective-[600px]"
    />
  );
}
