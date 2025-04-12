import { toast } from "react-toastify";

export const notifySuccess = (message: string, options?: object) => {
    toast.success(message, {
        className: 'custom-toast-success',
        bodyClassName: 'custom-toast-body',
        progressClassName: 'custom-toast-progress',
        position: "bottom-right",
        autoClose: 4000,
        ...options
    });
};

export const notifyError = (message: string, options?: object) => {
    toast.error(message, {
        className: 'custom-toast-error',
        bodyClassName: 'custom-toast-body',
        progressClassName: 'custom-toast-progress',
        position: "bottom-right",
        ...options
    });
};

export const notifyWarning = (message: string, options?: object) => {
    toast.warning(message, {
        className: 'custom-toast-warning',
        bodyClassName: 'custom-toast-body',
        progressClassName: 'custom-toast-progress',
        position: "bottom-right",
        ...options
    });
};
