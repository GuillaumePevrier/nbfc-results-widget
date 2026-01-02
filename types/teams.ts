export type TeamCompetition = {
  cp_no: string;
  name?: string;
  type?: string;
  level?: string;
};

export type ClubTeam = {
  key: string;
  label: string;
  category_code?: string;
  category_label?: string;
  number?: string;
  code?: string;
  competitions: TeamCompetition[];
};
