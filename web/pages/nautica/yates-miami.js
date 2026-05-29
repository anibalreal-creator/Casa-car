import { TopicSeoLanding, getTopicLandingProps } from '../../components/SeoLandingPage';

export async function getServerSideProps(context) {
  return getTopicLandingProps('nautica', 'yates-miami', context);
}

export default TopicSeoLanding;
