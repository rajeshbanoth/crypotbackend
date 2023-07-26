import { body } from "express-validator";

const placeOrder = [
  body("price").not().isEmpty().trim().withMessage("Price cannot be empty"),
  body("side").not().isEmpty().trim().withMessage("Side cannot be empty"),
  body("quantity").not().isEmpty().trim().withMessage("Amount cannot be empty"),
  body("type").not().isEmpty().trim().withMessage("Order Type cannot be empty"),
  body("marketPair")
    .not()
    .isEmpty()
    .trim()
    .withMessage("Order Type cannot be empty"),
];

export { placeOrder };
