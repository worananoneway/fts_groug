import { Reply, ReplyErrorField, ReplyErrorMessage, HttpStatusCode } from "@/api/utils/shared_types";
import { reply_result } from "./controller_replys";

export function emp_authentication(module_name: string, user: any, reply: any){
if (!user || !user.id) return console.log(`[Controller] bypass authenticated user.`);    
if (!user || !user.id) {
            console.error(`[Controller] Missing user ID from authenticated user.`);
            return reply.code(HttpStatusCode.UNAUTHORIZED).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNAUTHORIZED, null, [], null)
            );
        }
}