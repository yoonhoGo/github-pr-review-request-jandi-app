import got from "got";
import config from "../config/environments";

const JANDI_WEBHOOK_URL = config.JANDI_WEBHOOK_URL;
const JANDI_HEADER = {
  Accept: "application/vnd.tosslab.jandi-v2+json",
  "Content-Type": "application/json",
};

export interface ConnectInfo {
  title: string;
  description: string;
  imageUrl?: string;
}

export interface JandiPayload {
  body: string;
  connectColor: string;
  connectInfo: ConnectInfo[];
  email?: string;
}

export async function send(payload: JandiPayload) {
  if (!payload.email) {
    await got.post(JANDI_WEBHOOK_URL, {
      headers: JANDI_HEADER,
      json: payload,
    });
  }

  return;
}
