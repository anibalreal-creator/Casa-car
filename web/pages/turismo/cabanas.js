import { TopicSeoLanding, getTopicLandingProps } from '../../components/SeoLandingPage';

export async function getServerSideProps(context) {
  return getTopicLandingProps('turismo', 'cabanas', context);
}

export default TopicSeoLanding;
