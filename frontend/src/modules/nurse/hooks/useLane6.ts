import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '../../../shared/api-client/http-client';

type ApiEnvelope<T> = {
  data: T;
  meta?: unknown;
};

// Chuẩn hóa response từ BFF/backend envelope để UI luôn nhận đúng payload nghiệp vụ.
export const extractApiData = <T>(payload: ApiEnvelope<T> | T): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
};

// Chuẩn hóa payload danh sách để các màn nurse không vỡ khi API trả envelope hoặc phân trang.
export const extractApiListData = <T>(
  payload: ApiEnvelope<T[] | { items?: T[] }> | T[] | { items?: T[] },
): T[] => {
  const data = extractApiData<T[] | { items?: T[] }>(payload);

  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray(data.items)) return data.items;

  return [];
};

// Types
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

const ORDER_STATUSES = new Set<OrderDto['status']>([
  'pending',
  'done',
  'blocked',
  'delayed',
  'active',
  'cancelled',
]);

/** Kiểm tra tối thiểu payload y lệnh trước khi đưa dữ liệu từ API vào UI nurse. */
function isTreatmentOrderWireDto(value: unknown): value is TreatmentOrderWireDto {
  if (!value || typeof value !== 'object') return false;

  const order = value as Record<string, unknown>;
  const hasId = typeof order.treatmentOrderId === 'string' || typeof order.id === 'string';
  const hasStatus =
    typeof order.status === 'string' && ORDER_STATUSES.has(order.status as OrderDto['status']);

  return hasId && hasStatus;
}

/** Chuẩn hóa payload y lệnh backend thành model hiển thị dùng chung cho các component nurse. */
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

export interface QueueTicketDto {
  id: string;
  number: number;
  calledAt: string | null;
}

export interface VitalsQueueStatsDto {
  measuredTodayCount: number;
  measuredTodayDelta: number;
  waitingCount: number;
  allergyAlertTodayCount: number;
  avgMinutesPerPatient: number;
}

// Queries
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

// Mutations
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

export const useCallNextTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => httpClient.post('/inpatient/queue-tickets/call-next', {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vitals-queue'] }),
  });
};

export const useRecallTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticketId: string) =>
      httpClient.post(`/inpatient/queue-tickets/${ticketId}/recall`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vitals-queue'] }),
  });
};

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

// Specimen Collection Types & Hooks
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

// Emergency Identity Standardization Types & Hooks
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
