import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const FloatingOctopus = () => {
  const [frameIndex, setFrameIndex] = useState(0);
  const frames = ['/sitelogo1.png', '/sitelogo2.png', '/sitelogo3.png', '/sitelogo2.png'];

  const [targetPos, setTargetPos] = useState(() => ({
    x: Math.random() * 98 + 1,
    y: Math.random() * 98 + 1
  }));

  const [rotation, setRotation] = useState(() => {
    const dx = targetPos.x - 50;
    const dy = targetPos.y - 50;
    return Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  });

  useEffect(() => {
    const frameInterval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % 4);
    }, 200);
    return () => clearInterval(frameInterval);
  }, []);

  useEffect(() => {
    const moveRandomly = () => {
      const nextX = Math.random() * 98 + 1;
      const nextY = Math.random() * 98 + 1;

      setTargetPos(prev => {
        const dx = nextX - prev.x;
        const dy = nextY - prev.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        setRotation(angle);
        return { x: nextX, y: nextY };
      });
    };

    const moveInterval = setInterval(moveRandomly, 11000); 
    return () => clearInterval(moveInterval);
  }, [targetPos.x, targetPos.y]);

  return (
    <motion.div
  initial={{ x: '30vw', y: '30vh', rotate: rotation }}
  style={{
    position: 'fixed',
    zIndex: 0,
    pointerEvents: 'none',
    left: 0,
    top: 0,
    width: '100px',
    height: '100px'
  }}
  animate={{
    x: `${targetPos.x}vw`,
    y: `${targetPos.y}vh`,
    rotate: rotation,
  }}
  transition={{
    x: { duration: 11, ease: "linear" },
    y: { duration: 11, ease: "linear" },
    rotate: { duration: 0.8, ease: "easeInOut" }
  }}
>
  {/* Artık map kullanmıyoruz, sadece frameIndex'e göre tek bir resim gösteriyoruz */}
  <img
    src={frames[frameIndex]}
    alt="Floating Octopus"
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      pointerEvents: 'none'
    }}
  />
</motion.div>
  );
};