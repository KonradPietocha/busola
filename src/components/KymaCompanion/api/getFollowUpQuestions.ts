import { getClusterConfig } from 'state/utils/getBackendInfo';

interface GetFollowUpQuestionsParams {
  sessionID?: string;
  handleFollowUpQuestions: (results: any) => void;
  handleFollowUpError: () => void;
  clusterUrl: string;
  token: string;
  certificateAuthorityData: string;
}

export default async function getFollowUpQuestions({
  sessionID = '',
  handleFollowUpQuestions,
  handleFollowUpError,
  clusterUrl,
  token,
  certificateAuthorityData,
}: GetFollowUpQuestionsParams): Promise<void> {
  try {
    const { backendAddress } = getClusterConfig();
    const url = `${backendAddress}/ai-chat/followup`;
    const k8sAuthorization = `Bearer ${token}`;

    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Cluster-Certificate-Authority-Data': certificateAuthorityData,
        'X-Cluster-Url': clusterUrl,
        'X-K8s-Authorization': k8sAuthorization,
        'Session-Id': sessionID,
      },
      method: 'POST',
    });

    const promptSuggestions = (await response.json()).promptSuggestions;
    if (!promptSuggestions) {
      throw new Error('No follow-up questions available');
    }

    handleFollowUpQuestions(promptSuggestions);
  } catch (error) {
    handleFollowUpError();
    console.error('Error fetching data:', error);
  }
}
