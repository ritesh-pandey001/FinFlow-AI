import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineX, HiCheckCircle, HiExclamationCircle, HiInformationCircle } from 'react-icons/hi';

const icons = {
  success: HiCheckCircle,
  error: HiExclamationCircle,
  info: HiInformationCircle,
  warning: HiExclamationCircle,
};

const colors = {
  success: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', text: '#10b981' },
  error: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
  info: { bg: 'rgba(34, 211, 238, 0.1)', border: 'rgba(34, 211, 238, 0.2)', text: '#22d3ee' },
  warning: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' },
};

export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type] || icons.info;
          const color = colors[toast.type] || colors.info;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-xl shadow-2xl max-w-sm"
              style={{
                background: color.bg,
                border: `1px solid ${color.border}`,
              }}
            >
              <Icon size={20} style={{ color: color.text, flexShrink: 0 }} />
              <p className="text-sm text-white/90 flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
              >
                <HiOutlineX size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
