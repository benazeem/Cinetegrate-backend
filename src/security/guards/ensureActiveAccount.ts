import type { User } from "@models/User.js";

const ensureActiveAccount   = (user:User)=>{
    if(user.accountStatus !== "active") {
        return false;
    }
    return true;
} ;
export default ensureActiveAccount;