import { TopicSeoLanding, getTopicLandingProps } from '../../components/SeoLandingPage';

export async function getServerSideProps(context) {
  return getTopicLandingProps('nautica', 'lanchas', context);
}

export default TopicSeoLanding;
