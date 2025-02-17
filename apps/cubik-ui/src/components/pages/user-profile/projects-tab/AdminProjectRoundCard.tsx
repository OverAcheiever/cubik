import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
} from '@chakra-ui/accordion';
import { Box, Center, Flex, HStack, Stack } from '@chakra-ui/layout';
import { Skeleton } from '@chakra-ui/skeleton';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/tabs';
import { Player } from '@lottiefiles/react-lottie-player'; // todo: package size is too big
import {
  Contribution,
  ProjectJoinRound,
  ProjectJoinRoundStatus,
  Round,
  UserModel,
} from '@cubik/database';
import { isFuture, isPast } from 'date-fns';
import { CgMediaLive } from 'react-icons/cg';
import { FiClock } from 'react-icons/fi';
import { HiBan } from 'react-icons/hi';
import { ImCheckboxChecked } from 'react-icons/im';
import { IoMdDoneAll } from 'react-icons/io';
import RoundStatus from '~/components/common/dates/Status';
import { useErrorBoundary } from '~/hooks/useErrorBoundary';
import ProjectContributorsAdminView from '../../projects/project-details/project-interactions/project-tabs/ProjectContributorsAdminView';
import { CountdownTimer } from '../../projects/project-explorer/header/FundingRoundBanner';
import FundingOverview from './project-admin-dashboard/FundingOverview';
import ProjectInsights from './project-admin-dashboard/ProjectInsights';

export const FundingRoundStatus = ({
  status,
  startTime,
  endTime,
  roundName,
}: {
  status: string;
  startTime?: Date;
  endTime?: Date;
  roundName?: string;
}) => {
  if (status === ProjectJoinRoundStatus.PENDING) {
    return (
      <HStack w="fit-content" rounded="full" bg="#470E47" p="6px 10px">
        <Box
          as={FiClock}
          color="#FFCCFF"
          boxSize={['10px', '11px', '12px', '14px']}
        />
        <Box
          as="p"
          noOfLines={1}
          whiteSpace={'nowrap'}
          textStyle={{ base: 'body6', md: 'body5' }}
          color="#FFCCFF"
        >
          Approval Pending
        </Box>
      </HStack>
    );
  } else if (status === ProjectJoinRoundStatus.APPROVED) {
    if (startTime && isFuture(startTime)) {
      // Selected
      return (
        <HStack w="fit-content" rounded="full" p="6px 10px" bg="#6D28D9">
          <ImCheckboxChecked size={14} color="#E6D6FF" />
          <Box
            as="p"
            noOfLines={1}
            whiteSpace={'nowrap'}
            textStyle={{ base: 'body6', md: 'body5' }}
            color="#E6D6FF"
          >
            Selected to Participate
          </Box>
        </HStack>
      );
    } else if (startTime && endTime && isPast(startTime) && isFuture(endTime)) {
      // Active in round
      return (
        <HStack
          w="fit-content"
          rounded="full"
          p="6px 10px"
          bg="surface.green.3"
        >
          <Box
            as={CgMediaLive}
            boxSize={{ base: '14px', md: '16px' }}
            color="#D6FFE5"
          />
          <Box
            as="p"
            noOfLines={1}
            whiteSpace={'nowrap'}
            textStyle={{ base: 'body6', md: 'body5' }}
            color="surface.green.1"
          >
            Participating
          </Box>
        </HStack>
      );
    } else if (endTime && isPast(endTime)) {
      // Participated in round
      return (
        <HStack w="fit-content" rounded="full" p="6px 10px" bg="brand.teal4">
          <Box
            as={IoMdDoneAll}
            boxSize={{ base: '12px', md: '14px' }}
            color="#E0FFFD"
          />
          <Box
            as="p"
            noOfLines={1}
            whiteSpace={'nowrap'}
            textStyle={{ base: 'body6', md: 'body5' }}
            color="brand.teal6"
          >
            Participated
          </Box>
        </HStack>
      );
    } else {
      return (
        <HStack w="fit-content" rounded="full" p="6px 10px" bg="#6D28D9">
          <ImCheckboxChecked size={14} color="#E6D6FF" />
          <Box
            as="p"
            noOfLines={1}
            whiteSpace={'nowrap'}
            textStyle={{ base: 'body6', md: 'body5' }}
            color="#E6D6FF"
          >
            Selected
          </Box>
        </HStack>
      );
    }
  } else if (status === ProjectJoinRoundStatus.REJECTED) {
    return (
      <HStack w="fit-content" rounded="full" p="6px 10px" bg="#EB7626">
        <HiBan size={14} color="#FFE3CC" />
        <Box
          as="p"
          noOfLines={1}
          whiteSpace={'nowrap'}
          textStyle={{ base: 'body6', md: 'body5' }}
          color="#FFE3CC"
        >
          Not Selected
        </Box>
      </HStack>
    );
  } else {
    return (
      <HStack>
        <Box>Approval Pending</Box>
      </HStack>
    );
  }
};

const AdminProjectRoundCard = ({
  isLoading,
  round,
}: {
  isLoading: boolean;
  round: ProjectJoinRound & {
    fundingRound: Round & {
      Contribution: (Contribution & {
        user: UserModel;
      })[];
    };
  };
}) => {
  const { ErrorBoundaryWrapper } = useErrorBoundary();
  return (
    <ErrorBoundaryWrapper>
      <Skeleton
        key={round.id}
        isLoaded={!isLoading}
        fadeDuration={2.5}
        opacity={isLoading ? 0.5 : 1}
        w="full"
      >
        <AccordionItem
          overflow={'scroll'}
          w="full"
          outline="none"
          border="none"
        >
          <AccordionButton
            borderRadius="12px"
            backgroundColor={'neutral.2'}
            p="16px"
            _expanded={{
              backgroundColor: 'neutral.3',
              borderBottomLeftRadius: '0px',
              borderBottomRightRadius: '0px',
            }}
            _hover={{
              backgroundColor: 'neutral.3',
            }}
            w="full"
          >
            <HStack justify={'space-between'} w="full">
              <HStack justify={'space-between'} w="full">
                <HStack gap={{ base: '6px', md: '8px' }}>
                  <FundingRoundStatus
                    status={round.status}
                    startTime={round.fundingRound.startTime}
                    endTime={round.fundingRound.endTime}
                  />
                  <Box
                    as="p"
                    textStyle={{ base: 'title6', md: 'title4' }}
                    color="neutral.11"
                  >
                    {round.fundingRound.roundName}
                  </Box>
                </HStack>
                <HStack display={{ base: 'none', md: 'flex' }}>
                  <RoundStatus
                    startDate={round.fundingRound.startTime}
                    endDate={round.fundingRound.endTime}
                  />
                </HStack>
              </HStack>
              <AccordionIcon display={{ base: 'none', md: 'block' }} />
            </HStack>
          </AccordionButton>
          <AccordionPanel
            backgroundColor={'neutral.3'}
            borderBottomRightRadius={'12px'}
            borderBottomLeftRadius={'12px'}
          >
            {round.status === ProjectJoinRoundStatus.APPROVED ? (
              isPast(round.fundingRound.startTime) ? ( // when live
                <Tabs variant={'cubik'}>
                  <TabList gap="12px" height="2.5rem">
                    <Tab
                      height="2.5rem"
                      fontSize={{ base: '14px', md: '17px' }}
                    >
                      Details
                    </Tab>
                    <Tab
                      height="2.5rem"
                      fontSize={{ base: '14px', md: '17px' }}
                    >
                      Contributors
                    </Tab>
                  </TabList>
                  <TabPanels p={'0'}>
                    <TabPanel>
                      {
                        <Stack
                          gap={{ base: '64px', sm: '72px', md: '80px' }}
                          padding={{
                            base: '0px',
                            sm: '0px',
                            md: '0px 16px',
                          }}
                          direction={{ base: 'column', lg: 'row' }}
                        >
                          <FundingOverview
                            amountRaise={round?.amountRaise ?? 0}
                            projectId={round.projectId as string}
                            roundId={round.fundingRound.id}
                            roundStartDate={round.fundingRound.startTime}
                            roundEndDate={round.fundingRound.endTime}
                          />
                          <ProjectInsights
                            projectId={round.projectId as string}
                            roundId={round.fundingRound.id}
                            roundStartDate={round.fundingRound.startTime}
                            roundEndDate={round.fundingRound.endTime}
                          />
                        </Stack>
                      }
                    </TabPanel>
                    <TabPanel p="0">
                      <Flex
                        direction="column"
                        w="full"
                        gap="32px"
                        overflow={'scroll'}
                      >
                        <ProjectContributorsAdminView
                          contributorsData={round.fundingRound.Contribution}
                        />
                      </Flex>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              ) : (
                // upcomming round
                <Center w="full" h="3.5rem">
                  <HStack
                    w="full"
                    p="16px"
                    rounded="12px"
                    gap="12px"
                    bg="#071A0F"
                  >
                    <Center p="8px" bg="#31F57910" rounded="full">
                      <Player
                        autoplay
                        loop={true}
                        src={
                          'https://assets7.lottiefiles.com/packages/lf20_4htoEB.json'
                        }
                        style={{ height: `24px`, width: `24px` }}
                      />
                    </Center>
                    <Box
                      as={'p'}
                      textStyle={{ base: 'body6', md: 'body5' }}
                      color="white"
                      textAlign={'start'}
                    >
                      You will start receiving contribution from the community
                      directly in the vault when the round starts -{' '}
                      <Box as="span" display={'inline-block'}>
                        {CountdownTimer({ date: round.fundingRound.startTime })}
                      </Box>{' '}
                      to go
                    </Box>
                  </HStack>
                </Center>
              )
            ) : round.status === ProjectJoinRoundStatus.PENDING ? (
              <Center w="full" h="3.5rem">
                <HStack
                  p="16px"
                  w="full"
                  rounded="12px"
                  gap="12px"
                  bg="#240724"
                >
                  <Center p="4px" bg="#240724" rounded="full">
                    <Player
                      autoplay
                      loop={true}
                      src={
                        'https://lottie.host/03a3bbb2-ceec-4634-ae91-219fe3daef10/vgGjcfeDoo.json'
                      }
                      style={{ height: `20px`, width: `20px` }}
                    />
                  </Center>
                  <Box
                    as={'p'}
                    textStyle={'body5'}
                    color="#FFCCFF"
                    textAlign={'start'}
                  >
                    The project is under review by the grant creator to
                    participate in the round.
                  </Box>
                </HStack>
              </Center>
            ) : round.status === ProjectJoinRoundStatus.REJECTED ? (
              //  status = rejected
              <Center w="full" h="3.5rem">
                <HStack
                  w="full"
                  p="16px"
                  rounded="12px"
                  gap="12px"
                  backgroundColor="surface.orange.3"
                >
                  <Center p="6px" bg="#FFFFFF12" rounded="full">
                    <Box
                      as={HiBan}
                      boxSize={{ base: '14px', md: '18px' }}
                      color="#FF9347"
                    />
                  </Center>
                  <Box
                    as={'p'}
                    textStyle={{ base: 'body6', md: 'body5' }}
                    color="#FF9347"
                    textAlign={'start'}
                  >
                    Your Project was not selected for this round by the grant
                    provider.
                  </Box>
                </HStack>
              </Center>
            ) : (
              <></>
            )}
          </AccordionPanel>
        </AccordionItem>
      </Skeleton>
    </ErrorBoundaryWrapper>
  );
};

export default AdminProjectRoundCard;
