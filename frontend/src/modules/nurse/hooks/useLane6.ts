import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '../../../shared/api-client/http-client';

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

// Queries
export const useBeds = () => {
  return useQuery({
    queryKey: ['beds'],
    queryFn: async () => {
      const res = await httpClient.get<any, { data: BedDto[] }>('/beds');
      return res.data;
    },
  });
};

export const useOrders = (params?: { recordId?: string; bedId?: string; departmentId?: string }) => {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.recordId) queryParams.append('recordId', params.recordId);
      if (params?.bedId) queryParams.append('bedId', params.bedId);
      if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
      const queryString = queryParams.toString();
      const res = await httpClient.get<any, { data: any[] }>(
        queryString ? `/treatment-orders?${queryString}` : '/treatment-orders'
      );
      return (res.data || []).map((o: any) => {
        const tone: 'danger' | 'purple' | 'blue' | 'green' =
          o.status === 'cancelled' ? 'danger' : o.status === 'done' ? 'blue' : 'purple';
        return {
          id: o.treatmentOrderId || o.id,
          treatmentOrderId: o.treatmentOrderId || o.id,
          title: o.orderType ? String(o.orderType).toUpperCase() : 'Y LỆNH',
          instruction: o.content || '',
          note: o.note || '',
          patient: o.patientName || '',
          patientName: o.patientName || '',
          room: o.roomLabel || '',
          roomLabel: o.roomLabel || '',
          status: o.status,
          time: o.orderedAt || '',
          tone,
        };
      });
    },
  });
};

export const useAdmissionBoard = () => {
  return useQuery({
    queryKey: ['admission-board'],
    queryFn: async () => {
      const res = await httpClient.get<any, { data: { waitingForBedRecords: AdmissionBoardDto[] } }>(
        '/inpatient/admission-board'
      );
      return res.data.waitingForBedRecords;
    },
  });
};

// Mutations
export const useToggleMaintenance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bedId, status }: { bedId: string; status: 'maintenance' | 'available' }) => {
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
      const res = await httpClient.put(`/treatment-orders/${orderId}/status`, { status, cancelReason });
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
