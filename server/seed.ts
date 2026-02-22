import { db } from "./db";
import { vipPackages, videos } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  const existingPackages = await db.select().from(vipPackages);
  if (existingPackages.length === 0) {
    await db.insert(vipPackages).values([
      {
        name: "Bronze",
        price: 100000,
        dailyTasks: 7,
        dailyEarning: "14000",
        level: 1,
        description: "Kuniga 7 ta video vazifa",
      },
      {
        name: "Silver",
        price: 300000,
        dailyTasks: 10,
        dailyEarning: "45000",
        level: 2,
        description: "Kuniga 10 ta video vazifa",
      },
      {
        name: "Gold",
        price: 500000,
        dailyTasks: 15,
        dailyEarning: "90000",
        level: 3,
        description: "Kuniga 15 ta video vazifa",
      },
      {
        name: "Platinum",
        price: 1000000,
        dailyTasks: 20,
        dailyEarning: "200000",
        level: 4,
        description: "Kuniga 20 ta video vazifa",
      },
      {
        name: "Diamond",
        price: 3000000,
        dailyTasks: 30,
        dailyEarning: "750000",
        level: 5,
        description: "Kuniga 30 ta video vazifa",
      },
    ]);
    console.log("VIP packages seeded");
  }

  const existingVideos = await db.select().from(videos);
  if (existingVideos.length === 0) {
    await db.insert(videos).values([
      {
        title: "Investitsiya strategiyalari",
        thumbnail: "/images/video-1.png",
        duration: 25,
        reward: "2000",
        category: "Moliya",
      },
      {
        title: "Kelajak shaharlari",
        thumbnail: "/images/video-2.png",
        duration: 20,
        reward: "1500",
        category: "Texnologiya",
      },
      {
        title: "Boylik sirlari",
        thumbnail: "/images/video-3.png",
        duration: 30,
        reward: "3000",
        category: "Biznes",
      },
      {
        title: "Kripto valyutalar",
        thumbnail: "/images/video-4.png",
        duration: 22,
        reward: "2500",
        category: "Kripto",
      },
      {
        title: "Lux hayot tarzi",
        thumbnail: "/images/video-5.png",
        duration: 18,
        reward: "1800",
        category: "Lifestyle",
      },
      {
        title: "Birja savdosi",
        thumbnail: "/images/video-6.png",
        duration: 28,
        reward: "2200",
        category: "Trading",
      },
    ]);
    console.log("Videos seeded");
  }
}
