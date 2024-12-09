import { createContext, useContext, useCallback } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PropTypes from 'prop-types'


// Crear el contexto
const ToastContext = createContext();


// Proveedor del contexto
export const ToastProvider = ({ children }) => {
  //const [toasts, dispatch] = useReducer(toastReducer, []);

  //useCallback para para estabilizar la función addToast (evitar re-renders)
  const addToast = useCallback((message, variant = "info", options = {}) => {
    const toastOptions = {
      ...options,
      toastId: message, // Clave para evitar toasts duplicados
      unique: true
    };

    switch(variant) {
      case "success":
        toast.success(message, toastOptions);
        break;
      case "error":
        toast.error(message, toastOptions);
        break;
      case "warn":
        toast.warn(message, toastOptions);
        break;
      default:
        toast.info(message, toastOptions);
    }
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
    </ToastContext.Provider>
  );
};

// Añade validación de PropTypes
ToastProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Hook personalizado para usar el contexto
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => { 
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};