import Image from "next/image";

export function VehiclePoster({ hero = false }: { hero?: boolean }) {
  return <Image src="/images/neurotrauma/rb19-stage.webp" width={1920} height={1080} quality={90}
    sizes={hero ? "(max-width: 800px) 92vw, 600px" : "(max-width: 800px) 90vw, 760px"}
    priority={hero} alt="Three-quarter render of Redgrund’s Red Bull RB19 model, showing the detailed navy, red and yellow livery, carbon floor, suspension, halo and slick tires."/>;
}
