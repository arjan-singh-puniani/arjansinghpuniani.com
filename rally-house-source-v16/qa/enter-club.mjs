// Existing fixtures enter exploration explicitly; match-entry QA uses Play tennis.
export async function enterClub(page,avatar,options={}){
  await page.getByText(avatar,{exact:true}).click(options);
  const explore=page.locator('[data-arrival-action="explore"]');
  if(await explore.isVisible())await explore.click();
}
