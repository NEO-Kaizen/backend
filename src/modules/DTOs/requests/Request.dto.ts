export interface trackPublicRequestDTO {
  protocol: string;
  email: string;
}

export type RequestWithRequesterEmail = {
  protocol: string;
  title: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  requester_email: string;
};