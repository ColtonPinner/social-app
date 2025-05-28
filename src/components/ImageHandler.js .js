import React from 'react';
import { Image } from "@heroui/react";

const ImageHandler = ({ imageUrl }) => {
  if (!imageUrl) return null;

  return (
    <Image
      src={imageUrl}
      alt="Tweet media"
      className="w-full h-auto max-h-[500px] object-cover rounded-lg"
      isBlurred={false}
      loading="lazy"
      radius="lg"
      showSkeleton={true}
      onError={(e) => {
        console.error('Image failed to load:', imageUrl);
        e.target.src = 'https://via.placeholder.com/500?text=Image+Not+Found'; // Fallback image
      }}
    />
  );
};

export default ImageHandler;