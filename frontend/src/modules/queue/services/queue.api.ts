/**
 * Adapter REST cho nghiệp vụ hàng đợi (`/api/v1`), gồm luồng public và thao tác nhân viên.
 *
 * @remarks
 * Endpoint `public/queue-display`, cấp số kiosk và in lại phiếu là public/no-JWT ở backend;
 * các endpoint còn lại phụ thuộc permission của nhân viên. `apiClient` trả lỗi theo contract
 * chung nên adapter này không nuốt hoặc đổi message lỗi; UI chịu trách nhiệm hiển thị fallback.
 * Các DTO chỉ chứa dữ liệu hàng đợi cần thiết, không chứa thông tin bệnh nhân.
 */
import { apiClient, type ApiSuccess } from '@/shared/api-client/api-client';

import type {
  IssuedTicketDto,
  PublicQueueDisplayDto,
  QueueStatus,
  QueueTicketDto,
} from '../types/queue.types';

/**
 * Lấy snapshot số đang gọi và các số vừa phục vụ cho màn hình LED công khai.
 *
 * @param date Ngày pháp lý Việt Nam dạng `YYYY-MM-DD`; bỏ qua để backend dùng ngày hiện tại.
 * @returns DTO chỉ gồm số thứ tự, trạng thái gọi và thời điểm gọi; không có PII.
 * @remarks Gọi `GET /api/v1/public/queue-display`, không yêu cầu JWT; lỗi HTTP được trả về cho bên gọi.
 */
export async function fetchPublicQueueDisplay(date?: string): Promise<PublicQueueDisplayDto> {
  const response = await apiClient.get<ApiSuccess<PublicQueueDisplayDto>>(
    '/public/queue-display',
    { params: date ? { date } : undefined },
  );
  return response.data.data;
}

/**
 * In lại một phiếu đã cấp mà không tạo số mới.
 *
 * @param ticketId Định danh phiếu cần in lại.
 * @returns Dữ liệu render tối thiểu gồm số, ngày và loại phiếu.
 * @remarks Gọi `POST /api/v1/queue-tickets/:ticketId/print`, không yêu cầu JWT; lỗi được trả về
 * để bên gọi quyết định có tiếp tục in vật lý hay không.
 */
export async function reprintQueueTicket(ticketId: string): Promise<{
  ticketId: string;
  number: number;
  date: string;
  renderData: { systemName: string; ticketType: string };
}> {
  const response = await apiClient.post<
    ApiSuccess<{
      ticketId: string;
      number: number;
      date: string;
      renderData: { systemName: string; ticketType: string };
    }>
  >(`/queue-tickets/${ticketId}/print`);
  return response.data.data;
}

/**
 * Liệt kê phiếu theo ngày/trạng thái cho màn hình nghiệp vụ của nhân viên.
 *
 * @param params Query `date` dạng `YYYY-MM-DD`, tùy chọn `status`, `page` và `pageSize`.
 * @returns Danh sách DTO cùng phân trang; fallback phân trang dùng `page=1`, `pageSize=50`.
 * @remarks Gọi `GET /api/v1/queue-tickets`, yêu cầu permission `queue.read`; lỗi được giữ nguyên.
 */
export async function listQueueTickets(params: {
  date: string;
  status?: QueueStatus;
  page?: number;
  pageSize?: number;
}): Promise<{
  items: QueueTicketDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  const response = await apiClient.get<ApiSuccess<QueueTicketDto[]>>('/queue-tickets', {
    params: {
      date: params.date,
      status: params.status,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 50,
    },
  });

  return {
    items: response.data.data,
    pagination: response.data.pagination ?? {
      page: 1,
      pageSize: 50,
      totalItems: response.data.data.length,
      totalPages: 1,
    },
  };
}

/**
 * Gọi số tiếp theo theo FIFO; backend chọn phiếu `waiting` có số nhỏ nhất và xử lý race giữa quầy.
 *
 * @param date Ngày pháp lý Việt Nam dạng `YYYY-MM-DD`; bỏ qua để backend dùng ngày hiện tại.
 * @returns Phiếu sau chuyển trạng thái sang `called`.
 * @remarks Gọi `POST /api/v1/queue-tickets/call-next`, yêu cầu `queue.call`; lỗi hết số hoặc
 * xung đột race được trả về để UI thông báo, không tự chọn số ở client.
 */
export async function callNextQueueTicket(date?: string): Promise<QueueTicketDto> {
  const response = await apiClient.post<ApiSuccess<QueueTicketDto>>(
    '/queue-tickets/call-next',
    date ? { date } : {},
  );
  return response.data.data;
}

/**
 * Bỏ qua phiếu đang được gọi theo lý do nghiệp vụ tùy chọn.
 *
 * @param ticketId Định danh phiếu hàng đợi.
 * @param reason Lý do gửi trong body khi có; backend vẫn là nơi kiểm tra chuyển trạng thái.
 * @returns Phiếu sau khi chuyển sang `skipped`.
 * @remarks Gọi `POST /api/v1/queue-tickets/:ticketId/skip`, yêu cầu `queue.manage`; lỗi được trả về.
 */
export async function skipQueueTicket(
  ticketId: string,
  reason?: string,
): Promise<QueueTicketDto> {
  const response = await apiClient.post<ApiSuccess<QueueTicketDto>>(
    `/queue-tickets/${ticketId}/skip`,
    reason ? { reason } : {},
  );
  return response.data.data;
}

/**
 * Gọi lại phiếu đang `called` để phát lại LED/PA mà không đổi trạng thái.
 *
 * @param ticketId Định danh phiếu cần phát lại.
 * @returns Phiếu sau khi backend cập nhật thời điểm gọi lại.
 * @remarks Gọi `POST /api/v1/queue-tickets/:ticketId/reannounce`, yêu cầu `queue.call`; lỗi được trả về.
 */
export async function reannounceQueueTicket(ticketId: string): Promise<QueueTicketDto> {
  const response = await apiClient.post<ApiSuccess<QueueTicketDto>>(
    `/queue-tickets/${ticketId}/reannounce`,
    {},
  );
  return response.data.data;
}

/**
 * Gọi lại phiếu đã bỏ qua với lý do bắt buộc.
 *
 * @param ticketId Định danh phiếu cần gọi lại.
 * @param reason Lý do gửi trong body để backend audit thao tác.
 * @returns Phiếu sau khi chuyển từ `skipped` về `called`.
 * @remarks Gọi `POST /api/v1/queue-tickets/:ticketId/recall`, yêu cầu `queue.manage`; lỗi được trả về.
 */
export async function recallQueueTicket(
  ticketId: string,
  reason: string,
): Promise<QueueTicketDto> {
  const response = await apiClient.post<ApiSuccess<QueueTicketDto>>(
    `/queue-tickets/${ticketId}/recall`,
    { reason },
  );
  return response.data.data;
}

/**
 * Cấp số tại quầy nhân viên với khóa idempotency do bên gọi tạo.
 *
 * @param idempotencyKey Khóa duy nhất cho một lần cấp số, gửi qua header `Idempotency-Key`.
 * @returns Phiếu mới ở trạng thái `waiting`.
 * @remarks Gọi `POST /api/v1/queue-tickets/desk`, yêu cầu `queue.manage`; backend quyết định số.
 */
export async function issueDeskTicket(idempotencyKey: string): Promise<IssuedTicketDto> {
  const response = await apiClient.post<ApiSuccess<IssuedTicketDto>>(
    '/queue-tickets/desk',
    {},
    { headers: { 'Idempotency-Key': idempotencyKey } },
  );
  return response.data.data;
}

/**
 * Cấp số kiosk qua REST công khai với idempotency key.
 *
 * @param idempotencyKey Khóa duy nhất cho một lần cấp số, gửi qua header `Idempotency-Key`.
 * @returns Phiếu mới ở trạng thái `waiting`, gồm dữ liệu tối thiểu để in biên nhận.
 * @remarks Gọi `POST /api/v1/queue-tickets`, không yêu cầu JWT; kiosk hiện dùng đây là kênh cấp số.
 * Backend dùng idempotency key để nhận diện việc retry, còn lỗi HTTP được trả về cho UI xử lý.
 */
export async function issueTicketRest(idempotencyKey: string): Promise<IssuedTicketDto> {
  const response = await apiClient.post<ApiSuccess<IssuedTicketDto>>(
    '/queue-tickets',
    {},
    { headers: { 'Idempotency-Key': idempotencyKey } },
  );
  return response.data.data;
}
