import { toast } from "react-toastify";

    export const notifySuccess = (message: string) => {
        toast.success(message, {
            className: 'custom-toast-success',
            bodyClassName: 'custom-toast-body',
            progressClassName: 'custom-toast-progress',
        });
    };
  
    export const notifyError = (message: string) => {
        toast.error(message, {
            className: 'custom-toast-error',
            bodyClassName: 'custom-toast-body',
            progressClassName: 'custom-toast-progress',
        });
    };
  
    export const notifyWarning = (message: string) => {
        toast.warning(message, {
            className: 'custom-toast-warning',
            bodyClassName: 'custom-toast-body',
            progressClassName: 'custom-toast-progress',
        });
    };
  