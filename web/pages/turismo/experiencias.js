import { TopicSeoLanding, getTopicLandingProps } from '../../components/SeoLandingPage';

export async function getServerSideProps(context) {
  return getTopicLandingProps('turismo', 'experiencias', context);
}

export default TopicSeoLanding;
