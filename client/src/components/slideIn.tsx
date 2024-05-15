import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function SlideIn({ children }: Props) {
  return (
    <>
      <AnimatePresence>
        <motion.div
          className="w-full flex items-center justify-center "
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
