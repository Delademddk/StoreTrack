import { useState } from "react";
import { imageUrl } from "@/lib/api";

function getInitials(name: string | undefined | null): string {
  if (!name) return "??";
  const trimmed = name.trim();
  if (!trimmed) return "??";
  if (trimmed.length === 1) return trimmed.toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
}

export function ProductImage({
  image,
  name,
  className,
  alt,
}: {
  image: string | null | undefined;
  name: string | undefined | null;
  className?: string;
  alt?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const src = imageUrl(image);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={alt ?? name ?? ""}
        className={className}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`${className} flex items-center justify-center bg-muted text-muted-foreground`}>
      <span className="font-semibold select-none">{getInitials(name)}</span>
    </div>
  );
}
