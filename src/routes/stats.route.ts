import express from "express";
const statsController = require("../controllers/stats.controller") ;

const router = express.Router();

router.get("/stats",statsController.getStats); // /api/stats?type=daily|weekly|monthly
router.post('/statistics',statsController.getStatistics)

export default router;
