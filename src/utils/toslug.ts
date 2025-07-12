export const toSlug = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')                     // tách dấu ra khỏi ký tự
    .replace(/[\u0300-\u036f]/g, '')     // xóa dấu
    .replace(/đ/g, 'd')                  // thay đ -> d
    .replace(/Đ/g, 'd')                  // thay Đ -> d
    .replace(/[^a-z0-9\s-]/g, '')        // xóa ký tự đặc biệt
    .trim()
    .replace(/\s+/g, '-')                // khoảng trắng -> dấu gạch ngang
    .replace(/-+/g, '-');                // gộp nhiều dấu - liên tiếp
};