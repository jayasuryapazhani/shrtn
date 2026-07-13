export async function getActiveTabUrl() {
  const tabsApi = globalThis.chrome?.tabs

  if (!tabsApi?.query) {
    throw new Error('Open Shrtn from the Brave extension toolbar.')
  }

  const tabs = await tabsApi.query({
    active: true,
    currentWindow: true,
  })

  const activeTab = tabs[0]

  if (!activeTab?.url) {
    throw new Error('Shrtn could not read this tab. Try a regular website.')
  }

  return activeTab.url
}