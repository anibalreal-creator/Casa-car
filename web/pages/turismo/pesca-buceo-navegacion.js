import { TopicSeoLanding, getTopicLandingProps } from '../../components/SeoLandingPage';

export async function getServerSideProps(context) {
  return getTopicLandingProps('turismo', 'pesca-buceo-navegacion', context);
}

export default TopicSeoLanding;
