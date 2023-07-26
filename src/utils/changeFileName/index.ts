import path from "path";
import { v4 as uuidv4 } from "uuid";

const ChangeFileName = async (card: any, userId: any) => {
  let res;

  if (card.mimetype == "image/png") {
    const newName: string = Date.now() + path.extname(userId) + uuidv4();
    res = newName + `.png`;
  } else if (card.mimetype == "image/jpeg") {
    const newName: string = Date.now() + path.extname(userId) + uuidv4();
    res = newName + `.jpeg`;
  } else if (card.mimetype == "image/jpg") {
    const newName: string = Date.now() + path.extname(userId) + uuidv4();
    res = newName + `.jpg`;
  }
  return res;
};
export { ChangeFileName };
