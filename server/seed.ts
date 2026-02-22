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
        title: "The Drama",
        thumbnail: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        actors: "Zendaya, Robert Pattinson",
        rating: "4.8",
        releaseDate: "2026-04-03",
        country: "United States",
        duration: 25,
        reward: "2000",
        category: "Drama",
      },
      {
        title: "On Drive",
        thumbnail: "https://image.tmdb.org/t/p/w500/628Dep6AxEtDxjZoGP78TsOxYbK.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        actors: "Sofiia Baiunlolanta, Bogdan Chulovskiy",
        rating: "5.0",
        releaseDate: "2026-04-09",
        country: "Ukraine",
        duration: 20,
        reward: "1500",
        category: "Action",
      },
      {
        title: "Biker",
        thumbnail: "https://image.tmdb.org/t/p/w500/jnE1GA0hlOOz0iJVkjCBhFNbMijt.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        actors: "Sharwanand, Atul Kulkarni, Malvika Nair",
        rating: "5.0",
        releaseDate: "2026-04-02",
        country: "United States",
        duration: 30,
        reward: "3000",
        category: "Action",
      },
      {
        title: "Supergirl",
        thumbnail: "https://image.tmdb.org/t/p/w500/q1GmrEHDVEhPCvm1k7bEkScwETm.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        actors: "Milly Alcock, Eve Ridley, Matthias Schoenaerts",
        rating: "4.5",
        releaseDate: "2026-06-26",
        country: "United States",
        duration: 22,
        reward: "2500",
        category: "Sci-Fi",
      },
      {
        title: "Jean Valjean",
        thumbnail: "https://image.tmdb.org/t/p/w500/jOFnq2EGKb1hYnNfBuQRn3kO6Bi.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        actors: "Gregory Gadebois, Bernard Campan, Alexandra Lamy",
        rating: "3.8",
        releaseDate: "2026-03-15",
        country: "France",
        duration: 18,
        reward: "1800",
        category: "Drama",
      },
      {
        title: "Leave One Day",
        thumbnail: "https://image.tmdb.org/t/p/w500/t5GEa9wSM7gp5DhRiMnPF5KuVjN.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        actors: "Juliette Armanet, Bastien Bouillon, Francois Robin",
        rating: "4.2",
        releaseDate: "2026-05-10",
        country: "France",
        duration: 28,
        reward: "2200",
        category: "Romance",
      },
      {
        title: "Thunderbolts",
        thumbnail: "https://image.tmdb.org/t/p/w500/m0lqSkZFCnCIxHhlOGmvQiH5gIo.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        actors: "Florence Pugh, Sebastian Stan, David Harbour",
        rating: "4.7",
        releaseDate: "2026-05-02",
        country: "United States",
        duration: 24,
        reward: "2800",
        category: "Action",
      },
      {
        title: "Mission Impossible 8",
        thumbnail: "https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDaSZpNtfmUmjS0.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        actors: "Tom Cruise, Hayley Atwell, Simon Pegg",
        rating: "4.9",
        releaseDate: "2026-05-23",
        country: "United States",
        duration: 26,
        reward: "3500",
        category: "Action",
      },
    ]);
    console.log("Videos seeded");
  }
}
