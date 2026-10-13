"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import { Autoplay, Navigation, EffectCoverflow } from "swiper/modules";
import Link from "next/link";
import type { Club } from "@/lib/config/clubs";

const HomeSlider = ({ clubs }: { clubs: Club[] }) => {
  return (
    <div className="w-full lg:w-3/5 lg:ml-12 xl:ml-8">
      <div className="relative">
        <Swiper
          modules={[Autoplay, Navigation, EffectCoverflow]}
          effect="coverflow"
          centeredSlides
          loop
          grabCursor
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          navigation
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 1.4 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 2.6 },
            1280: { slidesPerView: 3 },
          }}
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 150,
            modifier: 1.4,
            slideShadows: false,
          }}
          className="clubSwiper"
        >
          {clubs.map((club) => (
            <SwiperSlide key={club.id}>
              <div className="group relative h-72 sm:h-80 md:h-[22rem] rounded-3xl overflow-hidden shadow-[0_18px_60px_rgba(15,23,42,0.35)] bg-white dark:bg-slate-900">
                <Image
                  src={club.homepageImage}
                  alt={club.name}
                  fill
                  sizes="(max-width: 639px) 100vw, (max-width: 767px) 72vw, (max-width: 1023px) 50vw, (max-width: 1279px) 22vw, 230px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white">
                  <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-sky-300 mb-1">
                    {club.homepageSubtitle}
                  </p>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
                    {club.name}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-100/80">
                    {club.homepageBadge}
                  </p>

                    <Link href={`/events?club=${encodeURIComponent(club.slug)}`}>
                    <button
                      type="button"
                      className="mt-3 inline-flex items-center px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 text-[11px] sm:text-xs font-semibold text-foreground dark:text-white shadow-sm group-hover:bg-sky-500 group-hover:text-white transition-colors"
                    >
                      View more
                    </button>
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default HomeSlider;
