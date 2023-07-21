import { z } from "zod";
import { publicProcedure } from "../../../trpc";
import type { verifiedProjectsType } from "../../../types";

export const verifiedProjects = publicProcedure
  .input(
    z.object({
      filter: z.string().optional(),
      round: z.array(z.string()).optional(),
      seed: z.number().optional(),
      mobile: z.boolean().optional(),
    })
  )
  .query(async ({ input, ctx: { prisma } }) => {
    function seededRandom(seed: number) {
      var m = 25;
      var a = 11;
      var c = 17;

      seed = (a * seed + c) % m;
      return seed / m;
    }

    function shuffleArray<T>(array: T[], seed: number): T[] {
      // Create a copy of the original array to avoid modifying the input array
      const shuffledArray = [...array];

      // Fisher-Yates shuffle algorithm using the seededRandom function
      for (let i = shuffledArray.length - 1; i > 0; i--) {
        // Get a random index based on the seed
        const randomIndex = Math.floor(seededRandom(seed) * (i + 1));

        // Swap elements to shuffle the array
        const temp = shuffledArray[i];
        shuffledArray[i] = shuffledArray[randomIndex];
        shuffledArray[randomIndex] = temp;
      }

      return shuffledArray;
    }

    const result = await prisma.projectJoinRound.findMany({
      where: {
        status: "APPROVED",
      },
      select: {
        id: true,
        status: true,
        amountRaise: true,
        fundingRound: {
          select: {
            id: true,
            colorScheme: true,
            active: true,
            endTime: true,
            roundName: true,
            startTime: true,
          },
        },
        project: {
          select: {
            id: true,
            industry: true,
            logo: true,
            name: true,
            project_link: true,
            short_description: true,
            owner: {
              select: {
                username: true,
              },
            },
            isArchive: true,
            Contribution: input.mobile
              ? false
              : {
                  distinct: ["userId"],
                  select: {
                    id: true,
                    user: {
                      select: {
                        profilePicture: true,
                        username: true,
                      },
                    },
                  },
                  take: 3,
                },
          },
        },
      },
    });

    const res = shuffleArray(result, (input.seed as number) ?? 0).filter(
      (e) => e.project.isArchive === false
    );

    // when both filter are working
    if (input.filter && input.round && input.round?.length > 0) {
      const active = res.filter((e) => {
        const industry = JSON.parse(e.project.industry) as {
          label: string;
          value: string;
          colorScheme: string;
        }[];

        if (
          industry.some((e) => e.value === input.filter) &&
          input.round?.includes(e.fundingRound.id)
        ) {
          return e;
        }
      });

      return active;
    }

    // only filter working
    if (input.round && input.round.length === 0 && input.filter) {
      const active = res.filter((e) => {
        if (e.project.industry.includes(input.filter as string)) {
          return e;
        }
      });

      return active;
    }
    // only round working
    if (input.round && input.round.length > 0 && !input.filter) {
      const active = res.filter((e) => {
        if (input.round?.includes(e.fundingRound.id)) {
          return e;
        }
      });

      return active;
    }

    return res;
  });
