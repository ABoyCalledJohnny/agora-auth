import type { User } from "@/src/db/schema/index.ts";
import type { ApiSuccessResponse } from "@/src/types.ts";

import { NextResponse } from "next/server";

import { registerSchema } from "@/src/features/auth/contracts.ts";
import { AuthService } from "@/src/features/auth/services/auth.service.ts";
import { withApiHandler } from "@/src/lib/api-wrapper.ts";

export const POST = withApiHandler(
  {
    bodySchema: registerSchema,
    auth: false,
  },
  async ({ data, client }) => {
    const newUser = await AuthService.register(
      {
        username: data.username,
        email: data.email,
        password: data.password,
      },
      client,
    );

    const responseBody: ApiSuccessResponse<User> = {
      success: true,
      message: "User registered successfully",
      data: newUser,
    };

    return NextResponse.json(
      responseBody,
      { status: 201 }, // This sets the HTTP status code
    );
  },
);
