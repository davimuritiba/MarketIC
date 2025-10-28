import Image from "next/image";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Carregando MarketIC..." }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-neutral-700">
      <div className="relative h-20 w-20 animate-pulse">
        <Image
          src="/images/marketic avatar logo.png"
          alt="MarketIC"
          fill
          priority
          className="object-contain"
          sizes="80px"
        />
      </div>
      {message ? (
        <p className="text-base font-medium text-center text-neutral-800">
          {message}
        </p>
      ) : null}
    </div>
  );
}