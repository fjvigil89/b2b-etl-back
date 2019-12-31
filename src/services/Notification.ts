import Expo from "expo-server-sdk";
import { getConnection } from "typeorm";
import { User } from "../entity";

export class NotificationService {

  public async getAllTokens(client: string) {
    const clients = await getConnection(client).getRepository(User).find({});
    const tokens = clients
                      .filter((c) => c.notification !== null)
                      .map((c) => c.notification);
    return tokens;
  }

  public async sendNotification(tokens: string[], message: string): Promise<void> {
    const expo = new Expo();
    const messages = [];
    for (const pushToken of tokens) {
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`El token ${pushToken} de celular no es valido para recibir la notification `);
        continue;
      }

      messages.push({
        to: pushToken,
        sound: "default",
        body: message,
        data: { message },
      });
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);

      } catch (error) {
        console.error(error);
      }
    }

    const receiptIds = [];
    for (const ticket of tickets) {
      if (ticket.id) {
        receiptIds.push(ticket.id);
      }
    }

    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

        for (const key of Object.keys(receipts)) {
          if (receipts[key].status === "ok") {
            continue;
          } else if (receipts[key].status === "error") {
            if (receipts[key].details) {
              console.error(`El codigo de erro es: ${JSON.stringify(receipts[key].details)}`);
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
  }

}
