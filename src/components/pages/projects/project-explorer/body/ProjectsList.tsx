import {
  Avatar,
  Box,
  Button,
  Card,
  Center,
  Container,
  HStack,
  LinkBox,
  SlideFade,
  useToast,
  VStack,
  Wrap,
} from '@chakra-ui/react';
import { ProjectJoinRoundStatus, UserModel } from '@prisma/client';
import { isPast } from 'date-fns';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { HiCheck } from 'react-icons/hi';
import CustomTag from '~/components/common/tags/CustomTag';
import { RemoveToast, SuccessToast } from '~/components/common/toasts/Toasts';
import useListStore from '~/store/listStore';
import { verifiedProjectsType } from '~/types/projects';
import { formatNumberWithK } from '~/utils/formatWithK';
import ProjectsContributorsNumber, {
  ContributionType,
} from './ProjectsContributorsNumber';

// In the ProjectsList component
type ProjectsListProps = {
  allProjectsData: verifiedProjectsType[];
  owner?: UserModel;
};

type ProjectCardProps = {
  industry: string;
  projectId: string;
  ownerUsername: string;
  status: ProjectJoinRoundStatus;
  joinRoundId: string;
  startTime: Date;
  endTime: Date;
  colorScheme: string;
  roundName: string;
  projectName: string;
  projectLogo: string;
  projectDescription: string;
  amountRaised: number;
  contributions: ContributionType[];
};

const ProjectCard = (props: ProjectCardProps) => {
  const toast = useToast();
  const addProject = useListStore((state) => state.addProject);
  const removeProject = useListStore((state) => state.removeProject);
  const projectList = useListStore((state) => state.projectList);

  const [isHovered, setIsHovered] = useState(false);
  const [addedToList, setAddedToList] = useState(
    !!projectList.find((item) => item.id === props?.projectId)
  );

  const industry = JSON.parse(props?.industry);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  const handleAddOrRemoveProject = () => {
    if (addedToList) {
      removeProject(props.projectId);
      setAddedToList(false);
      RemoveToast({ toast, message: 'Project removed from list' });
    } else {
      // addProject(projectJoinRound.project);
      setAddedToList(true);
      SuccessToast({ toast, message: 'Project added to list' });
    }
  };

  useEffect(() => {
    setAddedToList(!!projectList.find((item) => item.id === props.projectId));
  }, [projectList]);
  return (
    <LinkBox
      as={Link}
      href={`/${props.ownerUsername}/${props.projectId}${
        props.status === ProjectJoinRoundStatus.APPROVED
          ? `/${props.joinRoundId}`
          : ``
      }`}
      w="100%"
      maxW={{
        base: '92vw',
        sm: '87vw',
        md: '44vw',
        lg: '29.5vw',
        xl: '25.5rem',
      }}
      position={'relative'}
    >
      <Card
        border={addedToList ? '2px solid #659C95' : '2px solid transparent'}
        borderRadius="16px"
        p="0"
        h={{ base: '20rem', md: '23rem' }}
        cursor="pointer"
        w="100%"
        maxW={{
          base: '92vw',
          sm: '87vw',
          md: '44vw',
          lg: '29.5vw',
          xl: '25.5rem',
        }}
        onTouchStart={() => setIsHovered((prevState) => !prevState)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        gap="0"
        background={'#0C0D0D'}
        _hover={{}}
        //  position={'relative'}
      >
        {/* card outline */}
        {addedToList && (
          <Center
            position={'absolute'}
            w="1.6rem"
            h="1.6rem"
            rounded="full"
            bg="#659C95"
            right="-0.6rem"
            top="-0.6rem"
          >
            <HiCheck size={16} color="#001F1B" />
          </Center>
        )}
        {/* card Header */}
        {isPast(props.startTime) && !isPast(props.endTime) && (
          // if project is participating in a round then make it visible else don't show it
          <Center
            display={
              props.status === ProjectJoinRoundStatus.APPROVED ? 'flex' : 'none'
            }
            w="full"
            bg={`surface.${props.colorScheme}.3`}
            borderTopRadius={'16px'}
          >
            <HStack
              w="full"
              gap="8px"
              borderColor="red"
              borderBottom={'red'}
              padding={'12px 24px'}
              borderTopRadius={'16px'}
              justifyContent="space-between"
            >
              <Box
                w="full"
                as="p"
                noOfLines={1}
                whiteSpace={'nowrap'}
                color={`surface.${props.colorScheme}.1`}
                textStyle={'overline4'}
                textTransform="uppercase"
                letterSpacing={'0.2em'}
                fontSize={{ base: '8px', md: '10px' }}
              >
                Participating In
              </Box>
              <Box
                as="p"
                w="fit-content"
                whiteSpace={'nowrap'}
                textStyle={{ base: 'title6', md: 'title5' }}
                color={`surface.${props.colorScheme}.1`}
              >
                {props.roundName}
              </Box>
            </HStack>
          </Center>
        )}
        {/* cards footer */}
        <VStack
          w="full"
          alignItems={'start'}
          justifyContent="space-between"
          h="full"
        >
          <VStack
            p="24px"
            gap={{ base: '12px', md: '16px' }}
            w="full"
            alignItems={'start'}
          >
            <HStack justifyContent={'space-between'}>
              <Avatar
                src={props.projectLogo}
                name="anchor"
                borderRadius={'8px'}
                size={{ base: 'md', md: 'lg' }}
              />
            </HStack>
            <VStack gap="0" spacing="0" w="full">
              <HStack align={'end'} w="full" justify="space-between">
                <Box as="p" textStyle={{ base: 'title4', md: 'title3' }}>
                  {props.projectName}
                </Box>
                <Box
                  as="p"
                  color="#A8F0E6"
                  textStyle={{ base: 'title4', md: 'title3' }}
                >
                  $
                  {formatNumberWithK(
                    (parseInt(
                      props.amountRaised?.toFixed(2) as string
                    ) as number) ?? 0
                  )}
                </Box>
              </HStack>
              <HStack w="full" justify="space-between">
                <Center>
                  <Box
                    noOfLines={1}
                    textAlign="start"
                    as="p"
                    whiteSpace={'nowrap'}
                    textStyle={{ base: 'title6', sm: 'title6', md: 'title5' }}
                    color={'brand.teal5'}
                    textTransform="lowercase"
                    w="full"
                  >
                    <Box as="span" color="neutral.7">
                      by
                    </Box>{' '}
                    @{props.ownerUsername}
                  </Box>
                </Center>
                <Box
                  color="neutral8"
                  as="p"
                  textStyle={{ base: 'body6', md: 'body5' }}
                >
                  Est. Match
                </Box>
              </HStack>
            </VStack>
            <Box
              color="neutral.8"
              as="p"
              textStyle={{ base: 'body5', md: 'body4' }}
              sx={{
                noOfLines: '3',
              }}
              alignContent="start"
              alignItems={'start'}
              textAlign={'start'}
            >
              {props.projectDescription}
            </Box>
          </VStack>
          {/* card footer */}
          <VStack
            marginTop={'0px !important'}
            p="8px 24px 24px 24px"
            w="full"
            position={'relative'}
          >
            <HStack
              display={isHovered ? 'none' : 'flex'}
              overflowX="hidden"
              w="full"
              justify="space-between"
            >
              <Box
                overflow="hidden"
                w="full"
                flex="4"
                minWidth="0"
                position="relative"
                _after={{
                  content: '""',
                  position: 'absolute',
                  top: '45%',
                  right: '0%',
                  transform: 'translateY(-50%)',
                  height: '2.2rem',
                  width: '3rem',
                  background:
                    'linear-gradient(90deg, #0C0D0D00 0%, #0C0D0D 80%)',
                }}
              >
                <HStack
                  overflow="clip"
                  w="200%"
                  mt="auto"
                  justify="start"
                  whiteSpace="nowrap" // Set whiteSpace to nowrap
                >
                  {industry.map((tag: any, key: any) => {
                    return (
                      <CustomTag color={tag.label} key={key}>
                        {tag.label}
                      </CustomTag>
                    );
                  })}
                </HStack>
              </Box>
              <ProjectsContributorsNumber
                projectId={props.projectId}
                contributorsList={props.contributions}
              />
            </HStack>
            <SlideFade in={isHovered} offsetY="0px" reverse>
              <HStack
                zIndex={'9'}
                w="full"
                justifyContent="start"
                position="absolute"
                left="0"
                p="8px 24px 24px 24px"
                bottom="0px"
                backgroundColor={'#0C0D0D'}
                borderRadius="36px"
                justify={'space-between'}
              >
                <Button
                  as={Link}
                  href={`/${props?.ownerUsername}/${props?.projectId}${
                    props.status === ProjectJoinRoundStatus.APPROVED
                      ? `/${props.joinRoundId}`
                      : ``
                  }`}
                  background={'#1D1F1E'}
                  color="white"
                  fontWeight={'700'}
                  borderColor="transparent"
                  outline="none"
                  //  w="calc(100% - 2.2rem)"
                  w="calc(100% )"
                  variant="connect_wallet"
                >
                  View Details
                </Button>
                {/* <IconButton
                  background={'#1D1F1E'}
                  color="white"
                  fontWeight={'700'}
                  borderColor="transparent"
                  outline="none"
                  onClick={handleAddOrRemoveProject}
                  aria-label="link"
                  variant="connect_wallet"
                  icon={
                    addedToList ? <MdRemove size={26} /> : <BsPlus size={26} />
                  }
                /> */}
              </HStack>
            </SlideFade>
          </VStack>
        </VStack>
      </Card>
    </LinkBox>
  );
};

const ProjectsList = ({ allProjectsData }: ProjectsListProps) => {
  return (
    <Container maxW="7xl" overflow={'visible'} p="0">
      <Wrap
        overflow={'visible'}
        py="8px"
        spacing="1.5rem"
        w="100%"
        margin="0"
        justify={'center'}
        align="center"
        direction={{ base: 'column', sm: 'row', md: 'row' }}
      >
        {allProjectsData.map(
          (projectJoinRound, key: React.Key | null | undefined) => {
            return (
              <ProjectCard
                key={key}
                endTime={projectJoinRound.fundingRound.endTime}
                industry={projectJoinRound.project.industry}
                projectId={projectJoinRound.project.id}
                joinRoundId={projectJoinRound.id}
                ownerUsername={projectJoinRound.project.owner.username}
                status={projectJoinRound.status}
                startTime={projectJoinRound.fundingRound.startTime}
                amountRaised={projectJoinRound.amountRaise ?? 0}
                projectDescription={projectJoinRound.project.short_description}
                projectLogo={projectJoinRound.project.logo}
                projectName={projectJoinRound.project.name}
                colorScheme={projectJoinRound.fundingRound.colorScheme}
                roundName={projectJoinRound.fundingRound.roundName}
                contributions={projectJoinRound.project.Contribution}
              />
            );
          }
        )}
      </Wrap>
    </Container>
  );
};

export default ProjectsList;
