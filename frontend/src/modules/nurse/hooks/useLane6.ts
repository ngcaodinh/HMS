import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '../../../shared/api-client/http-client';

/** Envelope thành công tối thiểu mà BFF/backend có thể trả về cho các hook lane nội trú. */
type ApiEnvelope<T> = {
  data: T;
  meta?: unknown;
};

/**
 * Lấy payload nghiệp vụ từ response có hoặc không có envelope `data`.
 * @param payload Response thô từ BFF/backend hoặc payload đã được tách sẵn.
 * @returns Giá trị nghiệp vụ cùng kiểu `T` để query/mutation dùng thống nhất.
 */
export const extractApiData = <T>(payload: ApiEnvelope<T> | T): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
};

/**
 * Chuẩn hóa response danh sách từ envelope, mảng trực tiếp hoặc payload phân trang `items`.
 * @param payload Response thô cần chuyển thành danh sách.
 * @returns Mảng item; trả mảng rỗng khi payload không có cấu trúc danh sách hợp lệ.
 */
export const extractApiListData = <T>(
  payload: ApiEnvelope<T[] | { items?: T[] }> | T[] | { items?: T[] },
): T[] => {
  const data = extractApiData<T[] | { items?: T[] }>(payload);

  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray(data.items)) return data.items;

  return [];
};

// Kiểu dữ liệu trao đổi của lane nội trú.
/**
 * DTO giường; `available` là trạng thái có thể nhận gán, còn `maintenance` không được gán.
 * `recordVersion` là phiên bản hồ sơ dùng cho optimistic lock khi mutation.
 */
export interface BedDto {
  id: string;
  bed: string;
  roomName: string;
  status: 'occupied' | 'empty' | 'emergency' | 'discharge' | 'maintenance' | 'available';
  patient: string | null;
  diagnosis: string | null;
  meta: string | null;
  allergy: boolean;
  assignmentId: string | null;
  recordId: string | null;
  recordVersion: number | null;
}

/**
 * Model y lệnh đã chuẩn hóa cho UI điều dưỡng.
 * `status` gồm chờ thực hiện, đang thực hiện, hoàn tất, bị chặn, trì hoãn hoặc đã hủy theo server;
 * `tone` chỉ là sắc thái trình bày tương ứng.
 * `time` giữ chuỗi thời gian từ API để component hiển thị, không tự đổi múi giờ tại adapter.
 */
export interface OrderDto {
  id: string;
  treatmentOrderId?: string;
  title: string;
  instruction: string;
  note: string;
  patient: string;
  patientName: string;
  room: string;
  roomLabel: string;
  status: 'pending' | 'done' | 'blocked' | 'delayed' | 'active' | 'cancelled';
  time: string;
  tone: 'danger' | 'purple' | 'blue' | 'green';
  orderType: string;
  hasAllergyWarning: boolean;
  executedByName: string | null;
}

/** Tập field tối thiểu có thể xuất hiện trong payload y lệnh từ backend. */
type TreatmentOrderWireDto = {
  treatmentOrderId?: string;
  id?: string;
  orderType?: string;
  content?: string;
  note?: string | null;
  status?: OrderDto['status'];
  orderedAt?: string;
  patientName?: string;
  roomLabel?: string;
  hasAllergyWarning?: boolean;
  executedByName?: string | null;
};

/** Các status y lệnh được phép đưa vào model UI; item có status khác sẽ bị loại khi map. */
const ORDER_STATUSES = new Set<OrderDto['status']>([
  'pending',
  'done',
  'blocked',
  'delayed',
  'active',
  'cancelled',
]);

/** Kiểm tra payload không tin cậy có đủ id và status y lệnh hợp lệ trước khi vào UI. */
function isTreatmentOrderWireDto(value: unknown): value is TreatmentOrderWireDto {
  if (!value || typeof value !== 'object') return false;

  const order = value as Record<string, unknown>;
  const hasId = typeof order.treatmentOrderId === 'string' || typeof order.id === 'string';
  const hasStatus =
    typeof order.status === 'string' && ORDER_STATUSES.has(order.status as OrderDto['status']);

  return hasId && hasStatus;
}

/**
 * Chuẩn hóa payload y lệnh backend thành model hiển thị dùng chung cho component điều dưỡng.
 * @param value Payload chưa tin cậy từ API.
 * @returns `OrderDto` với fallback hiển thị an toàn, hoặc `null` nếu thiếu id/status hợp lệ.
 * @remarks Không suy diễn status mới ở client; status ngoài whitelist bị loại để backend vẫn là
 * nguồn quyết định vòng đời y lệnh.
 */
export function mapTreatmentOrderDto(value: unknown): OrderDto | null {
  if (!isTreatmentOrderWireDto(value)) return null;

  const orderId = value.treatmentOrderId ?? value.id;
  if (!orderId || !value.status) return null;

  const tone: OrderDto['tone'] =
    value.status === 'cancelled' ? 'danger' : value.status === 'done' ? 'blue' : 'purple';

  return {
    id: orderId,
    treatmentOrderId: orderId,
    title: value.orderType ? value.orderType.toUpperCase() : 'Y LỆNH',
    instruction: value.content ?? '',
    note: value.note ?? '',
    patient: value.patientName ?? '',
    patientName: value.patientName ?? '',
    room: value.roomLabel ?? '',
    roomLabel: value.roomLabel ?? '',
    status: value.status,
    time: value.orderedAt ?? '',
    tone,
    orderType: value.orderType ?? '',
    hasAllergyWarning: value.hasAllergyWarning === true,
    executedByName: value.executedByName ?? null,
  };
}

/** Hồ sơ nội trú đang chờ giường; `version` dùng làm optimistic lock khi gán/chuyển giường. */
export interface AdmissionBoardDto {
  recordId: string;
  recordCode: string;
  patientName: string;
  patientId: string;
  diagnosis: string;
  age: number;
  gender: string;
  version: number;
}

/** Item trong worklist đo sinh hiệu; `createdAt` là chuỗi thời gian API và `version` là lock. */
export interface VitalsWorklistItemDto {
  recordId: string;
  recordCode: string;
  patientName: string;
  age: number;
  gender: string;
  diagnosis: string | null;
  allergies: string | null;
  version: number;
  createdAt: string;
}

/** Số thứ tự sinh hiệu; `calledAt` là chuỗi thời gian API hoặc `null` khi chưa gọi. */
export interface QueueTicketDto {
  id: string;
  number: number;
  calledAt: string | null;
}

/** Chỉ số tổng hợp của hàng đợi sinh hiệu; thời gian trung bình tính bằng phút. */
export interface VitalsQueueStatsDto {
  measuredTodayCount: number;
  measuredTodayDelta: number;
  waitingCount: number;
  allergyAlertTodayCount: number;
  avgMinutesPerPatient: number;
}

// Truy vấn dữ liệu lane nội trú.
/*
 * Contract chung của các query nurse: sở hữu server state qua React Query, không sở hữu local
 * state và không tự quyết định access control.
 * @remarks Cache, retry và lifecycle request theo QueryClient; module không đăng ký cleanup hoặc
 * cancellation riêng. UI nhận lỗi qua `error` và phải tự trình bày loading/empty/error phù hợp.
 */
/**
 * Lấy sơ đồ giường nội trú.
 * @returns Query result với mảng `BedDto`, response envelope được tách trước khi trả về.
 * @remarks Gọi `GET /beds` với permission `inpatient.read`; lỗi đi qua `error` của React Query,
 * cache dùng key `beds` và retry theo cấu hình QueryClient. Hook không tự cấp quyền hay optimistic
 * update.
 */
export const useBeds = () => {
  return useQuery({
    queryKey: ['beds'],
    queryFn: async () => {
      const res = await httpClient.get<unknown, { data: ApiEnvelope<BedDto[]> | BedDto[] }>(
        '/beds',
      );
      return extractApiListData<BedDto>(res.data);
    },
  });
};

/**
 * Lấy danh sách y lệnh theo hồ sơ, giường hoặc khoa.
 * @param params Bộ lọc tùy chọn được encode thành query `recordId`, `bedId`, `departmentId`.
 * @returns Query result với các y lệnh hợp lệ đã map thành `OrderDto`.
 * @remarks Gọi `GET /treatment-orders` với `treatment_order.read`; tự refetch mỗi 15 giây để
 * phản ánh thay đổi server, giữ cache theo bộ lọc và để React Query quản lý lỗi/retry mặc định.
 */
export const useOrders = (params?: {
  recordId?: string;
  bedId?: string;
  departmentId?: string;
}) => {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.recordId) queryParams.append('recordId', params.recordId);
      if (params?.bedId) queryParams.append('bedId', params.bedId);
      if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
      const queryString = queryParams.toString();
      const res = await httpClient.get<unknown, { data: ApiEnvelope<unknown[]> | unknown[] }>(
        queryString ? `/treatment-orders?${queryString}` : '/treatment-orders',
      );
      return extractApiListData<unknown>(res.data)
        .map(mapTreatmentOrderDto)
        .filter((order): order is OrderDto => order !== null);
    },
    refetchInterval: 15000,
  });
};

/**
 * Lấy hồ sơ nội trú đã chẩn đoán nhưng chưa có giường.
 * @returns Query result chỉ lấy `waitingForBedRecords` từ response admission board.
 * @remarks Gọi `GET /inpatient/admission-board` với `inpatient.read`; cache theo key cố định,
 * lỗi nằm ở `error`, còn việc cho phép gán giường do backend quyết định.
 */
export const useAdmissionBoard = () => {
  return useQuery({
    queryKey: ['admission-board'],
    queryFn: async () => {
      const res = await httpClient.get<
        unknown,
        {
          data:
            | ApiEnvelope<{ waitingForBedRecords: AdmissionBoardDto[] }>
            | { waitingForBedRecords: AdmissionBoardDto[] };
        }
      >('/inpatient/admission-board');
      return extractApiData<{ waitingForBedRecords: AdmissionBoardDto[] }>(res.data)
        .waitingForBedRecords;
    },
  });
};

// Mutation thay đổi dữ liệu lane nội trú.
/*
 * Contract chung của các mutation nurse: nhận payload qua `mutate`, trả mutation state và response
 * Axios nguyên trạng từ `httpClient`.
 * @remarks Module không optimistic update, không đăng ký cleanup/cancellation riêng; chỉ invalidate
 * query liên quan sau thành công. Lỗi HTTP/permission/conflict đi qua `error` của React Query.
 */
/**
 * Bật hoặc tắt trạng thái bảo trì của một giường.
 * @returns Mutation result; gọi `mutate` với `{ bedId, status }`, trong đó status là
 * `maintenance` hoặc `available`.
 * @remarks Gọi `PUT /beds/:bedId/maintenance` với permission `bed.assign`; thành công sẽ
 * invalidate cache `beds`, còn lỗi server được trả qua `error`. Không có optimistic update hay
 * cleanup riêng tại hook.
 */
export const useToggleMaintenance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bedId,
      status,
    }: {
      bedId: string;
      status: 'maintenance' | 'available';
    }) => {
      const res = await httpClient.put(`/beds/${bedId}/maintenance`, { status });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
    },
  });
};

/**
 * Gán một hồ sơ nội trú vào giường đang sẵn sàng.
 * @returns Mutation result; payload gồm `recordId`, `bedId`, `expectedRecordVersion` và `note`
 * tùy chọn.
 * @remarks Gọi `POST /medical-records/:recordId/bed-assignments` với permission `bed.assign`.
 * `expectedRecordVersion` là optimistic lock; conflict hoặc giường không khả dụng đi qua `error`.
 * Thành công invalidate cache `beds` và `admission-board`, không cập nhật lạc quan tại client.
 */
export const useAssignBed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recordId,
      bedId,
      expectedRecordVersion,
      note,
    }: {
      recordId: string;
      bedId: string;
      expectedRecordVersion: number;
      note?: string;
    }) => {
      const res = await httpClient.post(`/medical-records/${recordId}/bed-assignments`, {
        bedId,
        expectedRecordVersion,
        note,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['admission-board'] });
    },
  });
};

/**
 * Chuyển hồ sơ sang giường khác hoặc ghi nhận thao tác hiệu chỉnh xếp giường.
 * @returns Mutation result; payload nhận `expectedRecordVersion`, `reason`, action và các field
 * giường.
 * @remarks Gọi `POST /medical-records/:recordId/bed-assignment-changes` với `bed.change`.
 * Backend quyết định transition, kiểm tra lock và tình trạng giường; thành công chỉ invalidate
 * cache `beds`, lỗi conflict/validation nằm ở `error`.
 */
export const useChangeBedAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recordId,
      targetBedId,
      expectedRecordVersion,
      action = 'transfer',
      reason,
      note,
    }: {
      recordId: string;
      targetBedId?: string;
      expectedRecordVersion: number;
      action?: 'transfer' | 'correction';
      reason: string;
      note?: string;
    }) => {
      const res = await httpClient.post(`/medical-records/${recordId}/bed-assignment-changes`, {
        targetBedId,
        expectedRecordVersion,
        action,
        reason,
        note,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
    },
  });
};

/**
 * Gửi bản tóm tắt ra viện để ký.
 * @returns Mutation result; payload nhận chẩn đoán, tổng kết và điều kiện ra viện, mặc định
 * `dischargeCondition` là `improved`.
 * @remarks Gọi `POST /medical-records/:recordId/discharge-summaries` với permission
 * `discharge_summary.sign`; backend quyết định quyền ký và trạng thái hợp lệ. Thành công
 * invalidate cache `beds`; lỗi API đi qua `error`.
 */
export const useSignDischargeSummary = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recordId,
      dischargeDiagnosis,
      treatmentSummary,
      dischargeCondition = 'improved',
    }: {
      recordId: string;
      dischargeDiagnosis: string;
      treatmentSummary: string;
      dischargeCondition?: string;
    }) => {
      const res = await httpClient.post(`/medical-records/${recordId}/discharge-summaries`, {
        dischargeDiagnosis,
        treatmentSummary,
        dischargeCondition,
        signatureConfirmation: true,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
    },
  });
};

/**
 * Hoàn tất thủ tục xuất viện và giải phóng giường theo hồ sơ.
 * @returns Mutation result; payload gồm `recordId` và `expectedRecordVersion`.
 * @remarks Gọi `POST /medical-records/:recordId/discharges` với `discharge.execute` và gửi cờ
 * xác nhận cố định của contract hiện tại. Backend kiểm tra lock, điều kiện thanh toán và status;
 * thành công invalidate `beds` và `admission-board`, lỗi conflict/permission nằm ở `error`.
 */
export const useProcessDischarge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recordId,
      expectedRecordVersion,
    }: {
      recordId: string;
      expectedRecordVersion: number;
    }) => {
      const res = await httpClient.post(`/medical-records/${recordId}/discharges`, {
        expectedRecordVersion,
        dischargeConfirmation: true,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['admission-board'] });
    },
  });
};

/**
 * Cập nhật status thực hiện của y lệnh điều trị.
 * @returns Mutation result; payload nhận status `done`, `cancelled`, `delayed` hoặc `active` và
 * lý do hủy tùy chọn.
 * @remarks Gọi `PUT /treatment-orders/:orderId/status` với `treatment_order.execute`.
 * Backend là nguồn quyết định transition và người thực hiện; thành công invalidate cache `orders`.
 */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      cancelReason,
    }: {
      orderId: string;
      status: 'done' | 'cancelled' | 'delayed' | 'active';
      cancelReason?: string;
    }) => {
      const res = await httpClient.put(`/treatment-orders/${orderId}/status`, {
        status,
        cancelReason,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

/**
 * Hủy y lệnh điều trị bằng endpoint nghiệp vụ riêng.
 * @returns Mutation result; payload của `mutate` gồm `orderId` và `cancelReason` bắt buộc.
 * @remarks Gọi `POST /treatment-orders/:orderId/cancel` với `treatment_order.cancel`; backend
 * quyết định status cuối cùng và ghi audit, còn client chỉ invalidate cache `orders` sau thành
 * công.
 */
export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, cancelReason }: { orderId: string; cancelReason: string }) => {
      const res = await httpClient.post(`/treatment-orders/${orderId}/cancel`, { cancelReason });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

/**
 * Lấy worklist, số thứ tự và thống kê đo sinh hiệu nội trú.
 * @returns Query result gồm worklist, ticket đang gọi, số chờ và thống kê theo response API.
 * @remarks Gọi `GET /inpatient/vitals-queue` với `inpatient.read`; response envelope được tách
 * trước khi trả về, lỗi nằm ở `error` và cache/retry theo QueryClient. Hook không tự polling ngoài
 * policy của provider.
 */
export const useVitalsQueue = () =>
  useQuery({
    queryKey: ['vitals-queue'],
    queryFn: async () => {
      const res = await httpClient.get<
        unknown,
        {
          data:
            | ApiEnvelope<{
                worklist: VitalsWorklistItemDto[];
                ticketQueue: {
                  currentCalled: QueueTicketDto | null;
                  waitingCount: number;
                  waitingNumbers: number[];
                };
                stats: VitalsQueueStatsDto;
                departmentName?: string | null;
              }>
            | {
                worklist: VitalsWorklistItemDto[];
                ticketQueue: {
                  currentCalled: QueueTicketDto | null;
                  waitingCount: number;
                  waitingNumbers: number[];
                };
                stats: VitalsQueueStatsDto;
                departmentName?: string | null;
              };
        }
      >('/inpatient/vitals-queue');
      return extractApiData(res.data);
    },
  });

/**
 * Gọi số tiếp theo trong hàng đợi đo sinh hiệu.
 * @returns Mutation result không cần payload đầu vào.
 * @remarks Gọi `POST /inpatient/queue-tickets/call-next` với `queue_ticket.call`; backend giữ
 * transition của ticket và xử lý race khi nhiều điều dưỡng cùng gọi. Thành công invalidate
 * `vitals-queue`, lỗi nằm ở `error`.
 */
export const useCallNextTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => httpClient.post('/inpatient/queue-tickets/call-next', {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vitals-queue'] }),
  });
};

/**
 * Gọi lại một ticket đang ở trạng thái được phép gọi lại.
 * @returns Mutation result; `mutate` nhận `ticketId`.
 * @remarks Gọi `POST /inpatient/queue-tickets/:ticketId/recall` với `queue_ticket.call`.
 * Backend quyết định status ticket; thành công invalidate `vitals-queue`, còn lỗi
 * conflict/permission được trả qua `error`.
 */
export const useRecallTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticketId: string) =>
      httpClient.post(`/inpatient/queue-tickets/${ticketId}/recall`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vitals-queue'] }),
  });
};

/**
 * Ghi sinh hiệu cho hồ sơ sau khi ticket đã được gọi.
 * @returns Mutation result; payload gồm số đo, `ticketId`, `recordId` và
 * `expectedRecordVersion` để chống ghi đè dữ liệu mới hơn.
 * @remarks Gọi `POST /medical-records/:recordId/vital-signs` với `vital_signs.record`; các số đo
 * dùng bpm, °C, mmHg, lần/phút, %, cm và kg theo field. Backend kiểm tra ticket đang gọi,
 * optimistic lock và việc hồ sơ chưa ghi sinh hiệu; thành công invalidate `vitals-queue`.
 */
export const useRecordVitalSigns = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      recordId: string;
      ticketId: string;
      expectedRecordVersion: number;
      pulse: number;
      temperatureC?: number;
      bloodPressureSystolic: number;
      bloodPressureDiastolic: number;
      respiratoryRate?: number;
      spo2: number;
      heightCm?: number;
      weightKg?: number;
      allergies?: string;
    }) => {
      const { recordId, ...body } = payload;
      return httpClient.post(`/medical-records/${recordId}/vital-signs`, body);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vitals-queue'] }),
  });
};

// Kiểu dữ liệu và hook lấy mẫu, in mã vạch, bàn giao mẫu.
/**
 * DTO vòng đời mẫu bệnh phẩm; status lần lượt là chờ lấy, đã lấy và đã bàn giao.
 * Các timestamp là chuỗi thời gian do API trả về, còn `barcodePrinted` là cờ server.
 */
export interface SpecimenDto {
  id: string;
  recordId: string;
  patientCode: string;
  patientName: string;
  departmentName: string;
  specimenCode: string;
  specimenType: string;
  orderDescription: string;
  priority: boolean;
  status: 'pending' | 'collected' | 'handed_over';
  barcodePrinted: boolean;
  collectedBy: string | null;
  collectedAt: string | null;
  handedOverBy: string | null;
  handedOverAt: string | null;
  labReceiverName: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lấy danh sách mẫu bệnh phẩm theo status tùy chọn.
 * @param status Bộ lọc query `status`; bỏ qua khi không truyền.
 * @returns Query result với danh sách `SpecimenDto` đã tách envelope.
 * @remarks Gọi `GET /specimens` với `specimen.read`; cache phân biệt theo status, lỗi/retry do
 * React Query quản lý và không có cleanup/cancellation riêng trong hook.
 */
export const useSpecimens = (status?: string) => {
  return useQuery({
    queryKey: ['specimens', status],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (status) queryParams.append('status', status);
      const queryString = queryParams.toString();
      const res = await httpClient.get<
        unknown,
        { data: ApiEnvelope<SpecimenDto[]> | SpecimenDto[] }
      >(queryString ? `/specimens?${queryString}` : '/specimens');
      return extractApiListData<SpecimenDto>(res.data);
    },
  });
};

/**
 * Tạo bản ghi mẫu bệnh phẩm từ chỉ định cần lấy.
 * @returns Mutation result; `mutate` nhận thông tin hồ sơ, loại mẫu, mô tả y lệnh và cờ ưu tiên.
 * @remarks Gọi `POST /specimens` với `specimen.create`; backend kiểm tra payload và quyền tạo.
 * Thành công invalidate toàn bộ cache `specimens`, lỗi API nằm ở `error`.
 */
export const useCreateSpecimen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      recordId: string;
      patientCode: string;
      patientName: string;
      departmentName: string;
      specimenCode: string;
      specimenType: string;
      orderDescription: string;
      priority?: boolean;
    }) => {
      const res = await httpClient.post('/specimens', payload);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specimens'] });
    },
  });
};

/**
 * Ghi nhận đã lấy mẫu bệnh phẩm.
 * @returns Mutation result; `mutate` nhận `{ id }` của mẫu.
 * @remarks Gọi `POST /specimens/:id/collect` với `specimen.collect`; backend quyết định transition
 * từ `pending` sang `collected`. Thành công invalidate cache `specimens`, lỗi nằm ở `error`.
 */
export const useCollectSpecimen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await httpClient.post(`/specimens/${id}/collect`, {});
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specimens'] });
    },
  });
};

/**
 * Ghi nhận thao tác in mã vạch cho mẫu bệnh phẩm.
 * @returns Mutation result; `mutate` nhận `{ id }` của mẫu.
 * @remarks Gọi `POST /specimens/:id/print-barcode` với `specimen.collect`; backend là nguồn quyết
 * định việc in và cập nhật cờ, thành công invalidate cache `specimens`.
 */
export const usePrintSpecimenBarcode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await httpClient.post(`/specimens/${id}/print-barcode`, {});
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specimens'] });
    },
  });
};

/**
 * Bàn giao mẫu đã lấy cho phòng xét nghiệm.
 * @returns Mutation result; `mutate` nhận id mẫu và tên người nhận tùy chọn.
 * @remarks Gọi `POST /specimens/:id/handoff` với `specimen.handoff`; backend quyết định transition
 * sang `handed_over` và ghi nhận người nhận. Thành công invalidate cache `specimens`, lỗi đi qua
 * `error`.
 */
export const useHandoffSpecimen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, labReceiverName }: { id: string; labReceiverName?: string }) => {
      const res = await httpClient.post(`/specimens/${id}/handoff`, { labReceiverName });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specimens'] });
    },
  });
};

// Kiểu dữ liệu và hook chuẩn hóa danh tính cấp cứu.
/**
 * DTO bệnh nhân cấp cứu còn ở trạng thái định danh tạm thời cần được chuẩn hóa.
 * `admittedAt` là chuỗi thời gian API; `sttNumber` chỉ là số thứ tự của danh sách hiện tại.
 */
export interface UnidentifiedEmergencyPatientDto {
  patientId: string;
  sttNumber: number;
  tempName: string;
  gender: 'male' | 'female';
  bedLabel: string | null;
  roomLabel: string | null;
  admittedAt: string;
  emergencyReason: string | null;
}

/**
 * Lấy danh sách bệnh nhân cấp cứu đang chờ chuẩn hóa danh tính.
 * @returns Query result với danh sách DTO đã tách envelope.
 * @remarks Gọi `GET /inpatient/emergency-unidentified-patients` với `inpatient.read`; dữ liệu
 * giữ cache theo query key, lỗi/retry theo QueryClient và quyền thật do backend quyết định.
 */
export const useUnidentifiedEmergencyPatients = () => {
  return useQuery({
    queryKey: ['unidentified-emergency-patients'],
    queryFn: async () => {
      const res = await httpClient.get<
        unknown,
        {
          data: ApiEnvelope<UnidentifiedEmergencyPatientDto[]> | UnidentifiedEmergencyPatientDto[];
        }
      >('/inpatient/emergency-unidentified-patients');
      return extractApiListData<UnidentifiedEmergencyPatientDto>(res.data);
    },
  });
};

/**
 * Gửi thông tin định danh chính thức cho bệnh nhân cấp cứu đang ở trạng thái bypass.
 * @returns Mutation result; payload có `patientId` dùng ở path và `privacyConfirmed: true` trong
 * body.
 * @remarks Gọi `POST /patients/:patientId/emergency-identity` với `patient_identity.standardize`.
 * Backend kiểm tra trạng thái bypass, validation và permission; thành công invalidate danh sách
 * cấp cứu cùng cache `beds`, lỗi hiển thị qua `error`.
 */
export const useStandardizeEmergencyIdentity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      patientId: string;
      fullName: string;
      dateOfBirth: string;
      gender: 'male' | 'female';
      phoneNumber: string;
      identityCardNumber?: string;
      address?: string;
      healthInsuranceCode?: string;
      guardianFullName?: string;
      guardianPhoneNumber?: string;
      privacyConfirmed: true;
    }) => {
      const { patientId, ...body } = payload;
      return httpClient.post(`/patients/${patientId}/emergency-identity`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidentified-emergency-patients'] });
      queryClient.invalidateQueries({ queryKey: ['beds'] });
    },
  });
};
