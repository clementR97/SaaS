import coachingImg from "@/assets/coaching.jpg";
import maderoImg from "@/assets/maderotherapy.jpg";
import massageImg from "@/assets/massage.jpg";
import naturoImg from "@/assets/naturopathy.jpg";
import type { ServiceImageKey } from "@/types/services";

export const SERVICE_IMAGE_BY_KEY: Record<ServiceImageKey, string> = {
  coaching: coachingImg,
  madero: maderoImg,
  massage: massageImg,
  naturo: naturoImg,
  zen: massageImg,
};
