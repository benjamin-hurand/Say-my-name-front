// contexts/personsDirectory.dataSource.ts
import { searchPersonsForAdmin } from "../services/business/admin/admin.service";
import { searchPersons } from "../services/business/persons/person.service";
import { Page } from "../services/business/subscriptions/subscriptions.service";
import {
  AdminPersonCardDto,
  PersonCardDto
} from "../services/dto/person/search/PersonCardDtos";
import { PersonSearchRequestDto } from "../services/dto/person/search/PersonSearchRequestDto";

export type DirectorySourceName = "user" | "admin";

export interface DirectoryDataSource {
  name: DirectorySourceName;
  search: (body: PersonSearchRequestDto, page: number, size: number) => Promise<Page<PersonCardDto>>;
  supportsFollow: boolean;
}

// ✅ carte admin => PersonCardDto de type AdminPersonCardDto (pas de `followed`)
const adaptAdminCard = (a: AdminPersonCardDto): PersonCardDto => ({
  idPerson: a.idPerson,
  displayName: a.displayName,
  photoSmallUrl: a.photoSmallUrl,
  photoLargeUrl: a.photoLargeUrl,
  primaryAttributes: a.primaryAttributes,
  extraAttributes: a.extraAttributes,
  emailStatus: a.emailStatus,
  hasPendingChangeRequests: a.hasPendingChangeRequests,
});

export const userDataSource: DirectoryDataSource = {
  name: "user",
  supportsFollow: true,
  async search(body, page, size) {
    // retourne Page<UserPersonCardDto> — compatible avec Page<PersonCardDto>
    return await searchPersons(body, page, size);
  },
};

export const adminDataSource: DirectoryDataSource = {
  name: "admin",
  supportsFollow: false,
  async search(body, page, size) {
    const res = await searchPersonsForAdmin(body, { page, size });
    return {
      ...res,
      content: res.content.map(adaptAdminCard),
      size,
    };
  },
};
