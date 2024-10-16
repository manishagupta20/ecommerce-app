import express from "express";

import {placeOrder,
    placeOrderStripe,
    placeOrderRazorpay,
    allOrders,
    userOrders,
    verifyStripe,
    updateStatus} from "../controllers/orderController.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";

const orderRouter = express.Router();

// for admin
orderRouter.post("/list",adminAuth, allOrders);
orderRouter.post("/status",adminAuth, updateStatus);


//payment 
orderRouter.post("/place",authUser, placeOrder);
orderRouter.post("/stripe",authUser, placeOrderStripe);
orderRouter.post("/razorpay",authUser, placeOrderRazorpay);


//for user
orderRouter.post("/userorders",authUser, userOrders);

//verify stripe payment
orderRouter.post("/verifyStripe",authUser, verifyStripe);


export default orderRouter;