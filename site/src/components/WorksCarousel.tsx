"use client";

import { useRef, useState } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import { A11y, EffectCoverflow, FreeMode, Keyboard, Mousewheel, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/free-mode";
import "swiper/css/pagination";
import { PlayPreview } from "@/components/PlayPreview";
import type { WorkCardData } from "@/lib/works";

/**
 * Latest works as an inverted-perspective carousel (after Skiper UI skiper49: coverflow tilted 40°, loop).
 * Drag, swipe or a sideways trackpad gesture glides with momentum and settles on the nearest poster;
 * clicking a side poster brings it to the centre, and the centre poster plays in the popover player.
 * No autoplay, so a work never moves away while someone is looking at it.
 */
export function WorksCarousel({ works }: { works: WorkCardData[] }) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [active, setActive] = useState(0);
  const current = works[active];

  return (
    <div className="works-carousel">
      <Swiper
        modules={[EffectCoverflow, FreeMode, Mousewheel, Pagination, Keyboard, A11y]}
        effect="coverflow"
        coverflowEffect={{ rotate: 40, stretch: 0, depth: 100, modifier: 1, slideShadows: true }}
        centeredSlides
        slidesPerView={1.7}
        breakpoints={{ 720: { slidesPerView: 3 } }}
        spaceBetween={0}
        freeMode={{ enabled: true, sticky: true, momentumRatio: 0.6, momentumVelocityRatio: 0.6 }}
        mousewheel={{ forceToAxis: true }}
        loop
        grabCursor
        keyboard={{ enabled: true, onlyInViewport: true }}
        pagination={{ clickable: true }}
        a11y={{
          prevSlideMessage: "上一件",
          nextSlideMessage: "下一件",
          paginationBulletMessage: "看第 {{index}} 件",
          slideLabelMessage: "第 {{index}} 件，共 {{slidesLength}} 件",
        }}
        onSwiper={(swiper) => { swiperRef.current = swiper; }}
        onSlideChange={(swiper) => setActive(swiper.realIndex)}
      >
        {works.map((work, index) => {
          const isActive = index === active;
          return (
            <SwiperSlide key={work.slug} className="works-carousel-slide">
              <div className="works-carousel-frame" inert={!isActive}>
                <PlayPreview work={work} small />
              </div>
              {!isActive && (
                // Mouse-only shortcut (keyboard uses the arrows and pagination). A plain element, not a
                // <button>, because Swiper will not start a drag on a button; after a drag it swallows the click.
                <div
                  className="works-carousel-jump"
                  aria-hidden="true"
                  onClick={() => swiperRef.current?.slideToLoop(index)}
                />
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
      <div className="works-carousel-bar">
        <button type="button" className="works-carousel-arrow" aria-label="上一件" onClick={() => swiperRef.current?.slidePrev()}>←</button>
        <p className="works-carousel-caption" aria-live="polite">
          <a href={current.url}>{current.title}</a>
          <span>{current.model} · {current.date}</span>
        </p>
        <button type="button" className="works-carousel-arrow" aria-label="下一件" onClick={() => swiperRef.current?.slideNext()}>→</button>
      </div>
    </div>
  );
}
