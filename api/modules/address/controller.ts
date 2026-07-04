import {
    District,
    Province,
    Subdistrict
} from './model';
import service from './service';

import {
    Condition,
    HttpStatus,
    HttpStatusCode,
    Reply,
    ReplyErrorField,
    ReplyErrorMessage,
    ReplySuccessMessage,
    ProjectStatus
} from '@/api/utils/shared_types';

async function get_provinces(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;
        if (!user || !user.id) {
            console.error("[Controller] Missing user ID from authenticated request.");
            return reply.code(HttpStatusCode.UNAUTHORIZED).send(<Reply>{
                status: HttpStatus.UNAUTHORIZED,
                statuscode: HttpStatusCode.UNAUTHORIZED,
                details: {
                    error: ReplyErrorField.UNAUTHORIZED,
                    message: ReplyErrorMessage.UNAUTHORIZED
                }
            });
        }
        const conditions: Condition = { sql: '', params: [] };

        const results = await service.get_provinces(conditions);
        switch (results.statuscode) {
            case HttpStatusCode.OK:
                console.log(`[Controller] Successfully retrieved ${results.data?.length || 0} provinces.`);
                return reply.code(HttpStatusCode.OK).send(<Reply>{
                    status: HttpStatus.OK,
                    statuscode: HttpStatusCode.OK,
                    details: {
                        provinces: results.data?.map(province => new Province(
                            province.province_id,
                            lang === 'en' ? province.province_name_en : province.province_name_th,
                            province.province_geography_id
                        ))
                    }
                });

            case HttpStatusCode.INTERNAL_SERVER_ERROR:
                return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    details: {
                        error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                        message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                    }
                });

            default:
                console.error("[Controller] An unrecognized status code was returned from getting Province:", results.statuscode);
                return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    details: {
                        error: ReplyErrorField.UNRECOGNIZED_STATUSCODE,
                        message: ReplyErrorMessage.UNRECOGNIZED_STATUSCODE
                    }
                });
        }
    } catch (error) {
        console.error("[Controller] An error occurred during getting Province:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            details: {
                error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
            }
        });
    }
}
async function get_districts(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;
        if (!user || !user.id) {
            console.error("[Controller] Missing user ID from authenticated request.");
            return reply.code(HttpStatusCode.UNAUTHORIZED).send(<Reply>{
                status: HttpStatus.UNAUTHORIZED,
                statuscode: HttpStatusCode.UNAUTHORIZED,
                details: {
                    error: ReplyErrorField.UNAUTHORIZED,
                    message: ReplyErrorMessage.UNAUTHORIZED
                }
            });
        }
        const conditions: Condition = { sql: '', params: [] };

        const results = await service.get_districts(conditions);
        switch (results.statuscode) {
            case HttpStatusCode.OK:
                console.log(`[Controller] Successfully retrieved ${results.data?.length || 0} districts.`);
                return reply.code(HttpStatusCode.OK).send(<Reply>{
                    status: HttpStatus.OK,
                    statuscode: HttpStatusCode.OK,
                    details: {
                        districts: results.data?.map(district => new District(
                            district.district_id,
                            lang === 'en' ? district.district_name_en : district.district_name_th,
                            district.district_province_id
                        ))
                    }
                });

            case HttpStatusCode.INTERNAL_SERVER_ERROR:
                return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    details: {
                        error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                        message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                    }
                });

            default:
                console.error("[Controller] An unrecognized status code was returned from getting District:", results.statuscode);
                return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    details: {
                        error: ReplyErrorField.UNRECOGNIZED_STATUSCODE,
                        message: ReplyErrorMessage.UNRECOGNIZED_STATUSCODE
                    }
                });
        }
    } catch (error) {
        console.error("[Controller] An error occurred during getting District:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            details: {
                error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
            }
        });
    }
}
async function get_subdistricts(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;
        if (!user || !user.id) {
            console.error("[Controller] Missing user ID from authenticated request.");
            return reply.code(HttpStatusCode.UNAUTHORIZED).send(<Reply>{
                status: HttpStatus.UNAUTHORIZED,
                statuscode: HttpStatusCode.UNAUTHORIZED,
                details: {
                    error: ReplyErrorField.UNAUTHORIZED,
                    message: ReplyErrorMessage.UNAUTHORIZED
                }
            });
        }
        const conditions: Condition = { sql: '', params: [] };

        const results = await service.get_subdistricts(conditions);
        switch (results.statuscode) {
            case HttpStatusCode.OK:
                console.log(`[Controller] Successfully retrieved ${results.data?.length || 0} subdistricts.`);
                return reply.code(HttpStatusCode.OK).send(<Reply>{
                    status: HttpStatus.OK,
                    statuscode: HttpStatusCode.OK,
                    details: {
                        subdistricts: results.data?.map(subdistrict => new Subdistrict(
                            subdistrict.subdistrict_id,
                            lang === 'en' ? subdistrict.subdistrict_name_en : subdistrict.subdistrict_name_th,
                            subdistrict.subdistrict_district_id,
                            subdistrict.subdistrict_zip_code
                        ))
                    }
                });

            case HttpStatusCode.INTERNAL_SERVER_ERROR:
                return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    details: {
                        error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                        message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                    }
                });

            default:
                console.error("[Controller] An unrecognized status code was returned from getting subdistricts:", results.statuscode);
                return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    details: {
                        error: ReplyErrorField.UNRECOGNIZED_STATUSCODE,
                        message: ReplyErrorMessage.UNRECOGNIZED_STATUSCODE
                    }
                });
        }
    } catch (error) {
        console.error("[Controller] An error occurred during getting subdistricts:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            details: {
                error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
            }
        });
    }
}
export default {
    get_provinces,
    get_districts,
    get_subdistricts
};