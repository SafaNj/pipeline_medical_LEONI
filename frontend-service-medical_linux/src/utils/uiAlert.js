import Swal from 'sweetalert2';

const DEFAULTS = {
  confirmButtonColor: '#0284c7',
  cancelButtonColor: '#64748b',
  background: '#ffffff',
};

export async function uiAlert({ icon = 'info', title = '', text = '' } = {}) {
  await Swal.fire({
    icon,
    title,
    text,
    ...DEFAULTS,
  });
}

export async function uiToast({ icon = 'success', title = '', timer = 2200 } = {}) {
  await Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    ...DEFAULTS,
  });
}

export async function uiConfirm({
  title = 'Confirmation',
  text = 'Confirmer ?',
  confirmButtonText = 'Confirmer',
  cancelButtonText = 'Annuler',
  icon = 'warning',
} = {}) {
  const res = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    ...DEFAULTS,
  });
  return Boolean(res.isConfirmed);
}

